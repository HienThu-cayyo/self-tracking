export const DAILY_FOCUS_GOAL_SECONDS = 25 * 60

export type DailyFocusLog = {
  date: string
  seconds: number
}

export type PersistedFocusTimer = {
  taskId: number | string | null
  durationSeconds: number
  elapsedSeconds: number
  startedAt: number | null
  lastAccountedAt: number | null
}

export type WeekDay = {
  date: string
  label: string
  day: number
  seconds: number
  completed: boolean
}

const LOGS_KEY = "self-track-focus-logs"
const TIMER_KEY = "self-track-focus-timer"

let initialized = false
let focusLogsSnapshot: DailyFocusLog[] = []
let focusTimerSnapshot: PersistedFocusTimer | null = null
const SERVER_FOCUS_LOGS_SNAPSHOT: DailyFocusLog[] = []
const SERVER_FOCUS_TIMER_SNAPSHOT: PersistedFocusTimer | null = null
const listeners = new Set<() => void>()

function todayKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseLogs(value: string | null): DailyFocusLog[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is DailyFocusLog =>
        typeof item?.date === "string" && typeof item?.seconds === "number" && item.seconds >= 0,
    )
  } catch {
    return []
  }
}

function parseTimer(value: string | null): PersistedFocusTimer | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (
      (typeof parsed?.taskId !== "number" &&
        typeof parsed?.taskId !== "string" &&
        parsed?.taskId !== null) ||
      typeof parsed?.durationSeconds !== "number" ||
      typeof parsed?.elapsedSeconds !== "number"
    ) {
      return null
    }
    return {
      taskId: parsed.taskId,
      durationSeconds: Math.max(0, parsed.durationSeconds),
      elapsedSeconds: Math.max(0, parsed.elapsedSeconds),
      startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : null,
      lastAccountedAt: typeof parsed.lastAccountedAt === "number" ? parsed.lastAccountedAt : null,
    }
  } catch {
    return null
  }
}

function persist() {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LOGS_KEY, JSON.stringify(focusLogsSnapshot))
  if (focusTimerSnapshot) {
    window.localStorage.setItem(TIMER_KEY, JSON.stringify(focusTimerSnapshot))
  } else {
    window.localStorage.removeItem(TIMER_KEY)
  }
}

function notify() {
  persist()
  listeners.forEach((listener) => listener())
}

function addIntervalToLogs(from: number, to: number) {
  let cursor = from
  while (cursor < to) {
    const cursorDate = new Date(cursor)
    const nextDay = new Date(cursorDate)
    nextDay.setHours(24, 0, 0, 0)
    const end = Math.min(to, nextDay.getTime())
    const seconds = Math.floor((end - cursor) / 1000)
    if (seconds > 0) {
      const date = todayKey(cursorDate)
      const existing = focusLogsSnapshot.find((log) => log.date === date)
      if (existing) {
        focusLogsSnapshot = focusLogsSnapshot.map((log) =>
          log.date === date ? { ...log, seconds: log.seconds + seconds } : log,
        )
      } else {
        focusLogsSnapshot = [...focusLogsSnapshot, { date, seconds }]
      }
    }
    cursor += Math.max(seconds, 1) * 1000
  }
}

function advanceTimer(now: number, shouldNotify: boolean) {
  const timer = focusTimerSnapshot
  if (!timer?.startedAt) return false

  const from = timer.lastAccountedAt ?? timer.startedAt
  const elapsedSeconds = Math.floor((now - from) / 1000)
  if (elapsedSeconds <= 0) return false

  const accountedUntil = from + elapsedSeconds * 1000
  addIntervalToLogs(from, accountedUntil)
  const nextTimer: PersistedFocusTimer = {
    ...timer,
    elapsedSeconds: Math.min(timer.durationSeconds, timer.elapsedSeconds + elapsedSeconds),
    lastAccountedAt: accountedUntil,
  }
  if (nextTimer.elapsedSeconds >= nextTimer.durationSeconds) {
    nextTimer.elapsedSeconds = nextTimer.durationSeconds
    nextTimer.startedAt = null
    nextTimer.lastAccountedAt = null
  }
  focusTimerSnapshot = nextTimer
  if (shouldNotify) notify()
  return true
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return
  focusLogsSnapshot = parseLogs(window.localStorage.getItem(LOGS_KEY))
  focusTimerSnapshot = parseTimer(window.localStorage.getItem(TIMER_KEY))
  initialized = true
  if (focusTimerSnapshot?.startedAt) {
    advanceTimer(Date.now(), false)
    persist()
  }
}

export function subscribeToFocusLogs(listener: () => void) {
  ensureInitialized()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getFocusLogsSnapshot() {
  ensureInitialized()
  return focusLogsSnapshot
}

export function getServerFocusLogsSnapshot() {
  return SERVER_FOCUS_LOGS_SNAPSHOT
}

export function subscribeToFocusTimer(listener: () => void) {
  ensureInitialized()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getFocusTimerSnapshot() {
  ensureInitialized()
  return focusTimerSnapshot
}

export function getServerFocusTimerSnapshot() {
  return SERVER_FOCUS_TIMER_SNAPSHOT
}

export function setFocusTimer(timer: PersistedFocusTimer | null) {
  ensureInitialized()
  focusTimerSnapshot = timer
  notify()
}

export function startFocusTimer(
  taskId: number | string | null,
  durationSeconds: number,
  now = Date.now(),
) {
  setFocusTimer({
    taskId,
    durationSeconds,
    elapsedSeconds: 0,
    startedAt: now,
    lastAccountedAt: now,
  })
}

export function pauseFocusTimer(now = Date.now()) {
  ensureInitialized()
  advanceTimer(now, false)
  if (focusTimerSnapshot) {
    focusTimerSnapshot = {
      ...focusTimerSnapshot,
      startedAt: null,
      lastAccountedAt: null,
    }
    notify()
  }
}

export function advanceFocusTimer(now = Date.now()) {
  ensureInitialized()
  advanceTimer(now, true)
}

export function getTimerRemainingSeconds(timer: PersistedFocusTimer | null, now = Date.now()) {
  if (!timer) return 0
  const runningSeconds = timer.startedAt
    ? Math.floor((now - (timer.lastAccountedAt ?? timer.startedAt)) / 1000)
    : 0
  return Math.max(0, timer.durationSeconds - timer.elapsedSeconds - runningSeconds)
}

export function getWeekDays(logs: DailyFocusLog[], anchor: Date): WeekDay[] {
  const monday = new Date(anchor)
  const dayOfWeek = monday.getDay() || 7
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - dayOfWeek + 1)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const dateKey = todayKey(date)
    const seconds = logs.find((log) => log.date === dateKey)?.seconds ?? 0
    return {
      date: dateKey,
      label: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"][index],
      day: date.getDate(),
      seconds,
      completed: seconds >= DAILY_FOCUS_GOAL_SECONDS,
    }
  })
}

export function calculateCurrentStreak(logs: DailyFocusLog[], anchor: Date) {
  const completedDates = new Set(
    logs.filter((log) => log.seconds >= DAILY_FOCUS_GOAL_SECONDS).map((log) => log.date),
  )
  const cursor = new Date(anchor)
  cursor.setHours(0, 0, 0, 0)
  if (!completedDates.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (completedDates.has(todayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function getTodayFocusSeconds(logs: DailyFocusLog[], anchor: Date) {
  return logs.find((log) => log.date === todayKey(anchor))?.seconds ?? 0
}
