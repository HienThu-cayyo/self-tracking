import { describe, expect, it } from "vitest"
import { getDashboardNotices } from "./notifications"
import type { CalendarEvent } from "./calendar"

describe("dashboard notifications", () => {
  it("includes only active event reminders and upcoming or overdue unfinished roadmaps", () => {
    const now = new Date(2026, 9, 28, 10, 0)
    const start = new Date(2026, 9, 28, 10, 20).toISOString()
    const event = { id: "e", title: "Thi", startsAt: start, reminderMinutes: 30 } as CalendarEvent
    const courses = [
      { id: "1", title: "Sắp đến hạn", deadline: "2026-10-31", progress: 20 },
      { id: "2", title: "Quá hạn", deadline: "2026-10-27", progress: 20 },
      { id: "3", title: "Đã xong", deadline: "2026-10-28", progress: 100 },
      { id: "4", title: "Còn lâu", deadline: "2026-11-02", progress: 0 },
    ]
    const notices = getDashboardNotices(
      [event, { ...event, id: "off", reminderMinutes: 0 }],
      courses,
      now,
    )
    expect(notices.map((item) => item.title)).toEqual(["Quá hạn", "Thi", "Sắp đến hạn"])
    expect(getDashboardNotices([event], [], new Date(2026, 9, 28, 9, 0))).toEqual([])
    expect(getDashboardNotices([event], [], new Date(2026, 9, 28, 11, 0))).toEqual([])
    expect(getDashboardNotices([{ ...event, startsAt: "invalid" }], [], now)).toEqual([])
  })
})
