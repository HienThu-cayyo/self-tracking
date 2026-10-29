import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import {
  and,
  calendarEvents,
  dailyFocusLogs,
  eq,
  focusTimerState,
  getDb,
  lessons,
  roadmaps,
  subjects,
  tasks,
  users,
} from "@smart-base/database/server"

import { getCurrentUser } from "@/_entities/auth/index.server"

const MAX_TASKS = 200
const MAX_COURSES = 100
const MAX_LESSONS = 500
const MAX_SUBJECTS = 200
const MAX_EVENTS = 500
const MAX_LOGS = 366

type ImportTask = {
  title: string
  subject: string
  due: string
  priority: "Cao" | "Vừa" | "Thấp"
  done: boolean
}

type ImportBody = {
  version?: unknown
  tasks?: unknown
  completedTasks?: unknown
  courses?: unknown
  subjects?: unknown
  events?: unknown
  summary?: unknown
  focusLogs?: unknown
  focusTimer?: unknown
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

function parseTask(value: unknown): ImportTask | null {
  if (!value || typeof value !== "object") return null
  const item = value as Record<string, unknown>
  const priority = item.priority
  if (priority !== "Cao" && priority !== "Vừa" && priority !== "Thấp") return null
  const title = text(item.title, 240)
  if (!title) return null
  return {
    title,
    subject: text(item.subject, 120) || "Cá nhân",
    due: text(item.due, 120) || "Chưa đặt thời gian",
    priority,
    done: item.done === true,
  }
}

function parseDate(value: unknown) {
  if (typeof value !== "string") return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

function parseDeadline(value: unknown) {
  if (value === null || value === "") return null
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return value
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  let body: ImportBody
  try {
    body = (await request.json()) as ImportBody
  } catch {
    return NextResponse.json({ message: "Dữ liệu import không hợp lệ" }, { status: 400 })
  }
  if (body.version !== 1) {
    return NextResponse.json({ message: "Phiên bản dữ liệu không được hỗ trợ" }, { status: 400 })
  }

  const taskValues = [
    ...(Array.isArray(body.tasks) ? body.tasks : []),
    ...(Array.isArray(body.completedTasks) ? body.completedTasks : []),
  ]
    .map(parseTask)
    .filter((task): task is ImportTask => Boolean(task))
  const uniqueTasks = taskValues.filter(
    (task, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.title === task.title &&
          candidate.subject === task.subject &&
          candidate.due === task.due,
      ) === index,
  )
  if (uniqueTasks.length > MAX_TASKS) {
    return NextResponse.json({ message: "Có quá nhiều công việc để import" }, { status: 400 })
  }

  const courses = Array.isArray(body.courses) ? body.courses.slice(0, MAX_COURSES) : []
  const subjectsInput = Array.isArray(body.subjects) ? body.subjects.slice(0, MAX_SUBJECTS) : []
  const eventsInput = Array.isArray(body.events) ? body.events.slice(0, MAX_EVENTS) : []
  const logsInput = Array.isArray(body.focusLogs) ? body.focusLogs.slice(0, MAX_LOGS) : []
  const db = getDb()

  await db.transaction(async (tx) => {
    const existingTasks = await tx.select().from(tasks).where(eq(tasks.userId, user.id))
    for (const task of uniqueTasks) {
      const match = existingTasks.find(
        (candidate) =>
          candidate.title === task.title &&
          candidate.subject === task.subject &&
          candidate.due === task.due,
      )
      if (match) {
        if (task.done && !match.done) {
          await tx
            .update(tasks)
            .set({ done: true, updatedAt: new Date() })
            .where(eq(tasks.id, match.id))
        }
      } else {
        await tx.insert(tasks).values({ id: randomUUID(), userId: user.id, ...task })
      }
    }

    const existingRoadmaps = await tx.select().from(roadmaps).where(eq(roadmaps.userId, user.id))
    const existingLessons = await tx
      .select({
        id: lessons.id,
        roadmapId: lessons.roadmapId,
        title: lessons.title,
        done: lessons.done,
      })
      .from(lessons)
      .innerJoin(roadmaps, eq(roadmaps.id, lessons.roadmapId))
      .where(eq(roadmaps.userId, user.id))
    let importedLessonCount = 0
    for (const value of courses) {
      if (!value || typeof value !== "object") continue
      const course = value as Record<string, unknown>
      const title = text(course.title, 200)
      if (!title) continue
      const goal = text(course.goal, 240) || "Lộ trình mới"
      const deadline = parseDeadline(course.deadline)
      const progress = Math.max(0, Math.min(100, Number(course.progress) || 0))
      let roadmap = existingRoadmaps.find((candidate) => candidate.title === title)
      if (!roadmap) {
        roadmap = (
          await tx
            .insert(roadmaps)
            .values({
              id: randomUUID(),
              userId: user.id,
              title,
              goal,
              deadline,
              progress,
              featured: false,
            })
            .returning()
        )[0]
        existingRoadmaps.push(roadmap)
      }
      const lessonValues = Array.isArray(course.lessons) ? course.lessons : []
      for (const lessonValue of lessonValues) {
        if (importedLessonCount >= MAX_LESSONS || !lessonValue || typeof lessonValue !== "object")
          break
        const lesson = lessonValue as Record<string, unknown>
        const lessonTitle = text(lesson.title, 240)
        if (!lessonTitle) continue
        const match = existingLessons.find(
          (candidate) => candidate.roadmapId === roadmap?.id && candidate.title === lessonTitle,
        )
        if (match) {
          if (lesson.done === true && !match.done) {
            await tx
              .update(lessons)
              .set({ done: true, updatedAt: new Date() })
              .where(eq(lessons.id, match.id))
          }
        } else {
          const created = {
            id: randomUUID(),
            roadmapId: roadmap.id,
            title: lessonTitle,
            done: lesson.done === true,
          }
          await tx.insert(lessons).values(created)
          existingLessons.push(created)
          importedLessonCount += 1
        }
      }
    }

    const existingSubjects = await tx.select().from(subjects).where(eq(subjects.userId, user.id))
    for (const value of subjectsInput) {
      if (!value || typeof value !== "object") continue
      const subject = value as Record<string, unknown>
      const name = text(subject.name, 160)
      const code = text(subject.code, 40)
      if (!name) continue
      const match = existingSubjects.find(
        (candidate) => (code && candidate.code === code) || candidate.name === name,
      )
      if (match) {
        if (subject.completed === true && !match.completed) {
          await tx
            .update(subjects)
            .set({ completed: true, updatedAt: new Date() })
            .where(eq(subjects.id, match.id))
        }
      } else {
        await tx.insert(subjects).values({
          id: randomUUID(),
          userId: user.id,
          name,
          code,
          credits: Math.max(0, Math.min(100, Number(subject.credits) || 0)),
          semester: text(subject.semester, 80) || "Học kỳ 1",
          completed: subject.completed === true,
        })
      }
    }

    const existingEvents = await tx
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, user.id))
    for (const value of eventsInput) {
      if (!value || typeof value !== "object") continue
      const event = value as Record<string, unknown>
      const title = text(event.title, 240)
      const startsAt = parseDate(event.startsAt)
      const endsAt = parseDate(event.endsAt)
      if (!title || !startsAt || !endsAt || endsAt < startsAt || event.source === "google") continue
      const duplicate = existingEvents.some(
        (candidate) =>
          candidate.title === title && candidate.startsAt.getTime() === startsAt.getTime(),
      )
      if (duplicate) continue
      await tx.insert(calendarEvents).values({
        id: randomUUID(),
        userId: user.id,
        title,
        startsAt,
        endsAt,
        allDay: event.allDay === true,
        location: text(event.location, 240) || null,
        description: text(event.description, 2000) || null,
        eventType: text(event.eventType, 40) || "personal",
        reminderMinutes: Math.max(0, Math.min(10080, Number(event.reminderMinutes) || 0)),
        source: "local",
        externalId: null,
        sourceCalendarId: null,
        metadata: null,
      })
    }

    for (const value of logsInput) {
      if (!value || typeof value !== "object") continue
      const log = value as Record<string, unknown>
      const date = text(log.date, 10)
      const seconds = Math.max(0, Math.min(86400, Math.floor(Number(log.seconds) || 0)))
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || seconds === 0) continue
      const existing = (
        await tx
          .select({ id: dailyFocusLogs.id, seconds: dailyFocusLogs.seconds })
          .from(dailyFocusLogs)
          .where(and(eq(dailyFocusLogs.userId, user.id), eq(dailyFocusLogs.date, date)))
          .limit(1)
      )[0]
      if (existing) {
        await tx
          .update(dailyFocusLogs)
          .set({ seconds: Math.min(86400, existing.seconds + seconds), updatedAt: new Date() })
          .where(eq(dailyFocusLogs.id, existing.id))
      } else {
        await tx.insert(dailyFocusLogs).values({ id: randomUUID(), userId: user.id, date, seconds })
      }
    }

    if (body.focusTimer && typeof body.focusTimer === "object") {
      const timer = body.focusTimer as Record<string, unknown>
      const durationSeconds = Math.max(
        0,
        Math.min(86400, Math.floor(Number(timer.durationSeconds) || 0)),
      )
      const accumulatedSeconds = Math.max(
        0,
        Math.min(durationSeconds, Math.floor(Number(timer.elapsedSeconds) || 0)),
      )
      if (durationSeconds > 0) {
        await tx
          .insert(focusTimerState)
          .values({
            userId: user.id,
            taskId: timer.taskId == null ? null : text(timer.taskId, 80),
            durationSeconds,
            accumulatedSeconds,
          })
          .onConflictDoUpdate({
            target: focusTimerState.userId,
            set: { durationSeconds, accumulatedSeconds, updatedAt: new Date() },
          })
      }
    }

    if (body.summary && typeof body.summary === "object") {
      const summary = body.summary as Record<string, unknown>
      const currentGpa = user.currentGpa === null ? Number(summary.currentGpa) : user.currentGpa
      const targetGpa = user.targetGpa === null ? Number(summary.targetGpa) : user.targetGpa
      await tx
        .update(users)
        .set({
          currentGpa:
            Number.isFinite(currentGpa) && currentGpa >= 0 && currentGpa <= 4
              ? currentGpa
              : user.currentGpa,
          targetGpa:
            Number.isFinite(targetGpa) && targetGpa >= 0 && targetGpa <= 4
              ? targetGpa
              : user.targetGpa,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
    }
  })

  return NextResponse.json({ ok: true })
}
