import { afterEach, describe, expect, it } from "vitest"

import {
  GUEST_STORAGE_KEY,
  clearGuestSnapshot,
  getGuestImportDismissedKey,
  readGuestSnapshot,
  writeGuestSnapshot,
} from "./guest"

const snapshot = {
  version: 1 as const,
  dirty: true,
  tasks: [
    {
      id: "task-1",
      title: "Ôn bài",
      subject: "Cá nhân",
      due: "Hôm nay",
      priority: "Cao" as const,
      done: false,
    },
  ],
  completedTasks: [],
  courses: [],
  subjects: [],
  events: [],
  summary: {
    learningProgressPercent: 0,
    completedTasks: 0,
    totalTasks: 1,
    currentGpa: null,
    targetGpa: null,
    completedCredits: 0,
    totalCredits: 0,
  },
  focusLogs: [],
  focusTimer: null,
}

describe("guest storage", () => {
  afterEach(() => localStorage.clear())

  it("persists and reads a versioned snapshot", () => {
    writeGuestSnapshot(snapshot)

    expect(readGuestSnapshot()).toEqual(snapshot)
    expect(localStorage.getItem(GUEST_STORAGE_KEY)).toContain('"version":1')
  })

  it("rejects malformed data and can clear the snapshot", () => {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ version: 2 }))
    expect(readGuestSnapshot()).toBeNull()

    writeGuestSnapshot(snapshot)
    clearGuestSnapshot()
    expect(readGuestSnapshot()).toBeNull()
  })

  it("names import dismissal per account", () => {
    expect(getGuestImportDismissedKey("user-a")).not.toBe(getGuestImportDismissedKey("user-b"))
  })
})
