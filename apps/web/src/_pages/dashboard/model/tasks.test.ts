import { describe, expect, it } from "vitest"

import { sortTasksByPriority } from "./tasks"

describe("task priority ordering", () => {
  it("places urgent tasks first and keeps insertion order within a priority", () => {
    const tasks = [
      { id: "normal-1", priority: "Vừa" as const },
      { id: "low", priority: "Thấp" as const },
      { id: "high", priority: "Cao" as const },
      { id: "normal-2", priority: "Vừa" as const },
    ]

    expect(sortTasksByPriority(tasks).map((task) => task.id)).toEqual([
      "high",
      "normal-1",
      "normal-2",
      "low",
    ])
  })
})
