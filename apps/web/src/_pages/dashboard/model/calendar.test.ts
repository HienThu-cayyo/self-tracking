import { describe, expect, it } from "vitest"

import {
  getEventDateKey,
  getLocalDateKey,
  getWeekDateKeys,
  isCalendarDateRangeValid,
  sortCalendarEvents,
} from "./calendar"

describe("calendar model", () => {
  it("sorts events by their start time", () => {
    const events = [
      { id: "later", startsAt: "2026-10-28T10:00:00.000Z" },
      { id: "earlier", startsAt: "2026-10-27T10:00:00.000Z" },
    ] as never[]
    expect(sortCalendarEvents(events).map((event) => event.id)).toEqual(["earlier", "later"])
  })

  it("validates timed and all-day ranges", () => {
    expect(isCalendarDateRangeValid("2026-10-27T09:00", "2026-10-27T10:00", false)).toBe(true)
    expect(isCalendarDateRangeValid("2026-10-27T10:00", "2026-10-27T09:00", false)).toBe(false)
    expect(isCalendarDateRangeValid("2026-10-27", "2026-10-27", true)).toBe(true)
  })

  it("creates stable local date keys for the weekly calendar", () => {
    const date = new Date(2026, 9, 27, 23, 30)
    expect(getLocalDateKey(date)).toBe("2026-10-27")
    expect(getWeekDateKeys(date)).toEqual([
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ])
    expect(getEventDateKey("2026-10-27T09:00:00")).toBe("2026-10-27")
  })
})
