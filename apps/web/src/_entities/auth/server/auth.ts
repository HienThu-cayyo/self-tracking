import "server-only"

import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

import { and, eq, getDb, gt } from "@smart-base/database/server"
import {
  dailyFocusLogs,
  emailVerificationTokens,
  focusTimerState,
  lessons,
  passwordResetTokens,
  roadmaps,
  sessions,
  subjects,
  tasks,
  users,
} from "@smart-base/database/server"
import { cookies } from "next/headers"

const scryptAsync = promisify(scrypt)
const SESSION_COOKIE = "self_track_session"
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24

export type AuthUser = Pick<
  typeof users.$inferSelect,
  "id" | "name" | "email" | "emailVerifiedAt" | "currentGpa" | "targetGpa"
>

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString("hex")}`
}

async function verifyPassword(password: string, encoded: string) {
  const [salt, expectedHex] = encoded.split(":")
  if (!salt || !expectedHex) return false
  const expected = Buffer.from(expectedHex, "hex")
  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function assertCredentials(name: string, email: string, password: string) {
  if (name.trim().length < 2) throw new Error("Tên cần có ít nhất 2 ký tự")
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Email không hợp lệ")
  if (password.length < 8) throw new Error("Mật khẩu cần có ít nhất 8 ký tự")
}

async function createVerificationToken(userId: string) {
  const rawToken = randomBytes(32).toString("hex")
  const db = getDb()
  await db.insert(emailVerificationTokens).values({
    id: hashToken(rawToken),
    userId,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  })
  return rawToken
}

async function createPasswordResetToken(userId: string) {
  const rawToken = randomBytes(32).toString("hex")
  const db = getDb()
  await db.insert(passwordResetTokens).values({
    id: hashToken(rawToken),
    userId,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  })
  return rawToken
}

function getActionUrl(path: string, token: string) {
  const baseUrl = process.env.AUTH_APP_URL?.trim() || "http://127.0.0.1:3000"
  return `${baseUrl}${path}?token=${encodeURIComponent(token)}`
}

function getLocalDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function logDevelopmentEmail(kind: "verify" | "reset", email: string, url: string) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[self.track auth ${kind}] ${email}: ${url}`)
  }
}

export async function registerUser(name: string, email: string, password: string) {
  assertCredentials(name, email, password)
  const normalizedEmail = normalizeEmail(email)
  const db = getDb()
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)
  if (existing[0]) throw new Error("Email này đã được đăng ký")

  const userId = randomUUID()
  const now = new Date()
  const passwordHash = await hashPassword(password)

  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({ id: userId, name: name.trim(), email: normalizedEmail, passwordHash })
    await tx.insert(tasks).values([
      {
        id: randomUUID(),
        userId,
        title: "Khám phá self.track",
        subject: "Cá nhân",
        due: "Chưa đặt thời gian",
        priority: "Vừa",
      },
      {
        id: randomUUID(),
        userId,
        title: "Đặt mục tiêu học tập đầu tiên",
        subject: "Cá nhân",
        due: "Chưa đặt thời gian",
        priority: "Thấp",
      },
    ])
    const roadmapId = randomUUID()
    await tx.insert(roadmaps).values({
      id: roadmapId,
      userId,
      title: "Lộ trình đầu tiên",
      goal: "Mục tiêu của bạn",
      progress: 0,
      featured: true,
    })
    await tx
      .insert(lessons)
      .values({ id: randomUUID(), roadmapId, title: "Thêm bài học đầu tiên", done: false })
    await tx.insert(subjects).values({
      id: randomUUID(),
      userId,
      name: "Môn học đầu tiên",
      code: "NEW101",
      credits: 3,
      semester: "Học kỳ 1",
      completed: false,
    })
    await tx
      .insert(dailyFocusLogs)
      .values({ id: randomUUID(), userId, date: getLocalDateKey(now), seconds: 0 })
    await tx
      .insert(focusTimerState)
      .values({ userId, durationSeconds: 1500, accumulatedSeconds: 0 })
  })

  const token = await createVerificationToken(userId)
  logDevelopmentEmail("verify", normalizedEmail, getActionUrl("/verify-email", token))
  return { userId, verificationUrl: getActionUrl("/verify-email", token) }
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email)
  const db = getDb()
  const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1)
  const user = result[0]
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    throw new Error("Email hoặc mật khẩu không đúng")
  if (!user.emailVerifiedAt) throw new Error("Vui lòng xác minh email trước khi đăng nhập")

  const sessionId = randomBytes(32).toString("hex")
  await db
    .insert(sessions)
    .values({ id: sessionId, userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  })
  return { id: user.id, name: user.name, email: user.email }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value
  if (!sessionId) return null
  const db = getDb()
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
      currentGpa: users.currentGpa,
      targetGpa: users.targetGpa,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1)
  const session = result[0]
  if (!session) {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
    return null
  }
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    emailVerifiedAt: session.emailVerifiedAt,
    currentGpa: session.currentGpa,
    targetGpa: session.targetGpa,
  }
}

export async function logoutUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  try {
    if (sessionId) await getDb().delete(sessions).where(eq(sessions.id, sessionId))
  } finally {
    // Logging out must invalidate the browser even if the database is briefly unavailable.
    cookieStore.delete(SESSION_COOKIE)
  }
}

export async function verifyEmail(rawToken: string) {
  const db = getDb()
  const token = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.id, hashToken(rawToken)),
        gt(emailVerificationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1)
  if (!token[0]) throw new Error("Liên kết xác minh không hợp lệ hoặc đã hết hạn")
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, token[0].userId))
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, token[0].id))
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const user = (
    await getDb().select().from(users).where(eq(users.email, normalizedEmail)).limit(1)
  )[0]
  if (!user) return
  const token = await createPasswordResetToken(user.id)
  logDevelopmentEmail("reset", normalizedEmail, getActionUrl("/reset-password", token))
}

export async function resetPassword(rawToken: string, password: string) {
  if (password.length < 8) throw new Error("Mật khẩu cần có ít nhất 8 ký tự")
  const db = getDb()
  const token = (
    await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.id, hashToken(rawToken)),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1)
  )[0]
  if (!token) throw new Error("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn")
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
    .where(eq(users.id, token.userId))
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, token.id))
  await db.delete(sessions).where(eq(sessions.userId, token.userId))
}

export { SESSION_COOKIE }
