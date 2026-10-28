import { describe, expect, it } from "vitest"

import { calculateLessonProgress, getRoadmapDeadlineState, parseLessonList } from "./roadmap"

describe("roadmap model", () => {
  it("parses numbered and plain lessons while removing duplicates", () => {
    expect(
      parseLessonList(
        "1. Tokenization\n2) Embedding Layer\n03 - Positional Encoding\nReading basics",
      ),
    ).toEqual(["Tokenization", "Embedding Layer", "Positional Encoding", "Reading basics"])
  })

  it("splits multiple numbered lessons on one line and supports chapter prefixes", () => {
    expect(parseLessonList("Chapter 1: Intro Chapter 2: Practice, 3. Review")).toEqual([
      "Intro",
      "Practice",
      "Review",
    ])
  })

  it("calculates local countdown states", () => {
    const today = new Date(2026, 9, 27)
    expect(getRoadmapDeadlineState("2026-10-27", today)).toEqual({
      kind: "today",
      label: "Hôm nay là hạn",
    })
    expect(getRoadmapDeadlineState("2026-11-01", today)).toMatchObject({
      kind: "upcoming",
      label: "Còn 5 ngày",
    })
    expect(getRoadmapDeadlineState("2026-10-20", today)).toMatchObject({
      kind: "overdue",
      label: "Đã quá hạn 7 ngày",
    })
  })

  it("uses fallback progress for roadmaps without lessons", () => {
    expect(calculateLessonProgress([], 46)).toBe(46)
    expect(calculateLessonProgress([{ done: true }, { done: false }])).toBe(50)
  })
})
