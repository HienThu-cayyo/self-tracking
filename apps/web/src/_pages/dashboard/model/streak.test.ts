import { describe, expect, it } from "vitest"

import {
  calculateCurrentStreak,
  DAILY_FOCUS_GOAL_SECONDS,
  getStreakFlowerStage,
  getTimerRemainingSeconds,
  getWeekDays,
} from "./streak"

describe("streak calculations", () => {
  const anchor = new Date(2026, 9, 27, 12, 0, 0)

  it("marks a day complete only after 25 focused minutes", () => {
    const week = getWeekDays(
      [
        { date: "2026-10-27", seconds: DAILY_FOCUS_GOAL_SECONDS - 1 },
        { date: "2026-10-26", seconds: DAILY_FOCUS_GOAL_SECONDS },
      ],
      anchor,
    )

    expect(week.find((day) => day.date === "2026-10-27")?.completed).toBe(false)
    expect(week.find((day) => day.date === "2026-10-26")?.completed).toBe(true)
  })

  it("counts a current streak through yesterday when today is not complete", () => {
    const logs = [
      { date: "2026-10-26", seconds: DAILY_FOCUS_GOAL_SECONDS },
      { date: "2026-10-25", seconds: DAILY_FOCUS_GOAL_SECONDS },
      { date: "2026-10-24", seconds: DAILY_FOCUS_GOAL_SECONDS },
    ]

    expect(calculateCurrentStreak(logs, anchor)).toBe(3)
  })

  it("does not count a streak across a missed day", () => {
    const logs = [
      { date: "2026-10-27", seconds: DAILY_FOCUS_GOAL_SECONDS },
      { date: "2026-10-25", seconds: DAILY_FOCUS_GOAL_SECONDS },
    ]

    expect(calculateCurrentStreak(logs, anchor)).toBe(1)
  })

  it("derives remaining timer seconds from a persisted running timer", () => {
    const now = 1_000_000
    expect(
      getTimerRemainingSeconds(
        {
          taskId: 1,
          durationSeconds: 1_500,
          elapsedSeconds: 300,
          startedAt: now - 25_000,
          lastAccountedAt: now - 25_000,
        },
        now,
      ),
    ).toBe(1_175)
  })

  it.each([
    [-1, "resting"],
    [0, "resting"],
    [1, "bud"],
    [2, "opening"],
    [3, "bloom"],
    [6, "bloom"],
    [7, "full"],
    [30, "full"],
  ] as const)("maps a %i-day streak to the %s flower stage", (days, expected) => {
    expect(getStreakFlowerStage(days)).toBe(expected)
  })
})
