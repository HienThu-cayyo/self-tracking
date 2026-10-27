import { describe, expect, it } from "vitest"

import { getDailyQuote } from "./dashboard"

describe("daily dashboard quote", () => {
  it("returns the same quote for the same local day", () => {
    const first = getDailyQuote(new Date(2026, 9, 27, 8))
    const second = getDailyQuote(new Date(2026, 9, 27, 20))

    expect(first).toBe(second)
    expect(first).toBeTruthy()
  })

  it("changes the quote pool selection across dates", () => {
    expect(getDailyQuote(new Date(2026, 9, 27))).not.toBe(getDailyQuote(new Date(2026, 9, 28)))
  })
})
