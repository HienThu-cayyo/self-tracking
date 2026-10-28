import type { CalendarEvent } from "./calendar"

export type DashboardNotice = {
  key: string
  title: string
  detail: string
  destination: "Lịch của tôi" | "Lộ trình"
  time: number
}

type NoticeCourse = {
  id: string | number
  title: string
  deadline: string | null
  progress: number
}

export function getDashboardNotices(events: CalendarEvent[], courses: NoticeCourse[], now: Date) {
  const notices: DashboardNotice[] = []
  const current = now.getTime()
  for (const event of events) {
    const start = new Date(event.startsAt).getTime()
    if (
      !Number.isFinite(start) ||
      event.reminderMinutes <= 0 ||
      current < start - event.reminderMinutes * 60000 ||
      current > start
    )
      continue
    notices.push({
      key: JSON.stringify(["event", event.id, event.title, event.startsAt, event.reminderMinutes]),
      title: event.title,
      detail: `Sắp diễn ra · ${new Date(start).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}`,
      destination: "Lịch của tôi",
      time: start,
    })
  }
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  for (const course of courses) {
    if (!course.deadline || course.progress >= 100 || !/^\d{4}-\d{2}-\d{2}$/.test(course.deadline))
      continue
    const target = Date.parse(`${course.deadline}T00:00:00Z`)
    if (!Number.isFinite(target)) continue
    const days = Math.round((target - today) / 86400000)
    if (days > 3) continue
    notices.push({
      key: JSON.stringify(["roadmap", course.id, course.title, course.deadline]),
      title: course.title,
      detail:
        days < 0
          ? `Đã quá hạn ${Math.abs(days)} ngày`
          : days === 0
            ? "Hôm nay là hạn"
            : `Còn ${days} ngày`,
      destination: "Lộ trình",
      time: target,
    })
  }
  return notices.sort((a, b) => a.time - b.time)
}
