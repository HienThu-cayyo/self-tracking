export const CALENDAR_EVENT_TYPES = ["exam", "deadline", "event", "study", "personal"] as const

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number]

export type CalendarEvent = {
  id: string
  title: string
  startsAt: string
  endsAt: string
  allDay: boolean
  location: string | null
  description: string | null
  eventType: CalendarEventType
  reminderMinutes: number
  source: "local" | "google"
  externalId: string | null
  sourceCalendarId: string | null
}

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  exam: "Thi cử",
  deadline: "Deadline",
  event: "Event",
  study: "Học tập",
  personal: "Cá nhân",
}

export function isCalendarEventType(value: unknown): value is CalendarEventType {
  return typeof value === "string" && CALENDAR_EVENT_TYPES.includes(value as CalendarEventType)
}

export function sortCalendarEvents(events: CalendarEvent[]) {
  return [...events].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  )
}

export function getLocalDateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function getWeekDateKeys(from: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(from)
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() + index)
    return getLocalDateKey(date)
  })
}

export function getEventDateKey(startsAt: string) {
  const date = new Date(startsAt)
  return Number.isNaN(date.getTime()) ? "" : getLocalDateKey(date)
}

export function isCalendarDateRangeValid(startsAt: string, endsAt: string, allDay: boolean) {
  if (!startsAt || !endsAt) return false
  if (allDay) return endsAt >= startsAt
  const start = new Date(startsAt).getTime()
  const end = new Date(endsAt).getTime()
  return Number.isFinite(start) && Number.isFinite(end) && end >= start
}
