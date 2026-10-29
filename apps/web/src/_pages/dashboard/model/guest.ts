import type { PersistedFocusTimer, DailyFocusLog } from "./streak"
import type { CalendarEvent } from "./calendar"

export const GUEST_STORAGE_KEY = "self-track-guest-v1"

export type GuestTask = {
  id: string | number
  title: string
  subject: string
  due: string
  priority: "Cao" | "Vừa" | "Thấp"
  done: boolean
}

export type GuestLesson = {
  id: string | number
  title: string
  done: boolean
}

export type GuestCourse = {
  id: string | number
  title: string
  goal: string
  progress: number
  deadline: string | null
  lessons: GuestLesson[]
  featured?: boolean
}

export type GuestSubject = {
  id: string | number
  name: string
  code: string
  progress: number
  color: string
  detail: string
  credits: number
  semester: string
  completed: boolean
}

export type GuestSummary = {
  learningProgressPercent: number
  completedTasks: number
  totalTasks: number
  currentGpa: number | null
  targetGpa: number | null
  completedCredits: number
  totalCredits: number
}

export type GuestSnapshot = {
  version: 1
  dirty: boolean
  tasks: GuestTask[]
  completedTasks: GuestTask[]
  courses: GuestCourse[]
  subjects: GuestSubject[]
  events: CalendarEvent[]
  summary: GuestSummary
  focusLogs: DailyFocusLog[]
  focusTimer: PersistedFocusTimer | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isPriority(value: unknown): value is GuestTask["priority"] {
  return value === "Cao" || value === "Vừa" || value === "Thấp"
}

function parseTask(value: unknown): GuestTask | null {
  if (!isRecord(value) || !isPriority(value.priority)) return null
  if (
    (typeof value.id !== "string" && typeof value.id !== "number") ||
    typeof value.title !== "string" ||
    typeof value.subject !== "string" ||
    typeof value.due !== "string" ||
    typeof value.done !== "boolean"
  ) {
    return null
  }
  return {
    id: value.id,
    title: value.title.slice(0, 240),
    subject: value.subject.slice(0, 120),
    due: value.due.slice(0, 120),
    priority: value.priority,
    done: value.done,
  }
}

function parseSnapshot(value: unknown): GuestSnapshot | null {
  if (!isRecord(value) || value.version !== 1) return null
  const tasks = Array.isArray(value.tasks) ? value.tasks.map(parseTask).filter(Boolean) : []
  const completedTasks = Array.isArray(value.completedTasks)
    ? value.completedTasks.map(parseTask).filter(Boolean)
    : []
  const courses = Array.isArray(value.courses) ? value.courses : []
  const subjects = Array.isArray(value.subjects) ? value.subjects : []
  const events = Array.isArray(value.events) ? value.events : []
  const summary = isRecord(value.summary) ? value.summary : {}
  const focusLogs = Array.isArray(value.focusLogs) ? value.focusLogs : []
  const focusTimer = value.focusTimer === null ? null : value.focusTimer

  if (
    tasks.some((task) => !task) ||
    completedTasks.some((task) => !task) ||
    courses.length > 200 ||
    subjects.length > 200 ||
    events.length > 500
  ) {
    return null
  }

  return {
    version: 1,
    dirty: value.dirty === true,
    tasks: tasks as GuestTask[],
    completedTasks: completedTasks as GuestTask[],
    courses: courses as GuestCourse[],
    subjects: subjects as GuestSubject[],
    events: events as CalendarEvent[],
    summary: {
      learningProgressPercent: Number(summary.learningProgressPercent) || 0,
      completedTasks: Number(summary.completedTasks) || 0,
      totalTasks: Number(summary.totalTasks) || 0,
      currentGpa: typeof summary.currentGpa === "number" ? summary.currentGpa : null,
      targetGpa: typeof summary.targetGpa === "number" ? summary.targetGpa : null,
      completedCredits: Number(summary.completedCredits) || 0,
      totalCredits: Number(summary.totalCredits) || 0,
    },
    focusLogs: focusLogs as DailyFocusLog[],
    focusTimer: focusTimer as PersistedFocusTimer | null,
  }
}

export function readGuestSnapshot(): GuestSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    return parseSnapshot(JSON.parse(window.localStorage.getItem(GUEST_STORAGE_KEY) ?? "null"))
  } catch {
    return null
  }
}

export function writeGuestSnapshot(snapshot: GuestSnapshot) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(snapshot))
}

export function clearGuestSnapshot() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(GUEST_STORAGE_KEY)
}

export function getGuestImportDismissedKey(userId: string) {
  return `self-track-guest-import-dismissed:${userId}`
}
