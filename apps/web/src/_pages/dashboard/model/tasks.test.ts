import { describe, expect, it } from "vitest"

import { groupTasksByPriority, sortTasksByPriority } from "./tasks"

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

  it("groups tasks into priority columns without changing order within a column", () => {
    const tasks = [
      { id: "low-1", priority: "Thấp" as const },
      { id: "high", priority: "Cao" as const },
      { id: "low-2", priority: "Thấp" as const },
      { id: "medium", priority: "Vừa" as const },
    ]

    const grouped = groupTasksByPriority(tasks)

    expect(grouped.Cao.map((task) => task.id)).toEqual(["high"])
    expect(grouped.Vừa.map((task) => task.id)).toEqual(["medium"])
    expect(grouped.Thấp.map((task) => task.id)).toEqual(["low-1", "low-2"])
  })
})
