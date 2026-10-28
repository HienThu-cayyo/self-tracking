import { describe, expect, it } from "vitest"

import { getDailyQuotes } from "./dashboard"

describe("daily dashboard quote", () => {
  it("returns the same quote for the same local day", () => {
    const first = getDailyQuotes(new Date(2026, 9, 27, 8))
    const second = getDailyQuotes(new Date(2026, 9, 27, 20))

    expect(first).toEqual(second)
    expect(first.greeting).toBeTruthy()
    expect(first.timer).toBeTruthy()
    expect(first.greeting).not.toBe(first.timer)
  })

  it("changes both quotes on the next local day", () => {
    const firstDay = getDailyQuotes(new Date(2026, 9, 27))
    const nextDay = getDailyQuotes(new Date(2026, 9, 28))

    expect(nextDay.greeting).not.toBe(firstDay.greeting)
    expect(nextDay.timer).not.toBe(firstDay.timer)
  })

  it("advances continuously across month and year boundaries", () => {
    const lastDayOfYear = getDailyQuotes(new Date(2026, 11, 31, 23, 59))
    const firstDayOfNextYear = getDailyQuotes(new Date(2027, 0, 1, 0, 1))

    expect(firstDayOfNextYear.greeting).not.toBe(lastDayOfYear.greeting)
    expect(firstDayOfNextYear.timer).not.toBe(lastDayOfYear.timer)
  })
})
