import "server-only"

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

export const GOOGLE_KEYWORDS = ["thi", "exam", "kiểm tra", "deadline", "event"]

export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  const appUrl = process.env.AUTH_APP_URL ?? "http://127.0.0.1:3000"
  if (!clientId || !clientSecret) throw new Error("Google Calendar OAuth chưa được cấu hình")
  return {
    clientId,
    clientSecret,
    appUrl,
    redirectUri:
      process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? `${appUrl}/api/calendar/google/callback`,
  }
}

function getEncryptionKey() {
  const value = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  if (!value || !/^[0-9a-f]{64}$/i.test(value)) {
    throw new Error("Google token encryption key chưa được cấu hình")
  }
  return Buffer.from(value, "hex")
}

export function encryptGoogleToken(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`
}

export function decryptGoogleToken(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".")
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("Google token không hợp lệ")
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
  )
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

export function googleAuthorizationUrl(state: string) {
  const config = getGoogleConfig()
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeGoogleCode(code: string) {
  const config = getGoogleConfig()
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  })
  if (!response.ok) throw new Error("Không thể xác thực Google Calendar")
  return (await response.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }
}

export async function getGoogleAccount(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error("Không thể đọc tài khoản Google")
  return (await response.json()) as { sub: string }
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const config = getGoogleConfig()
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  if (!response.ok) throw new Error("Google Calendar token đã hết hạn")
  return (await response.json()) as { access_token: string; expires_in: number }
}
