import { afterEach, describe, expect, it, vi } from "vitest"

const originalDatabaseUrl = process.env.DATABASE_URL

afterEach(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = originalDatabaseUrl
  vi.resetModules()
})

describe("database server entry point", () => {
  it("re-exports the lazy accessor without connecting at import time", async () => {
    delete process.env.DATABASE_URL
    vi.resetModules()

    const database = await import("./index.server")

    expect(Object.keys(database)).toEqual(["getDb"])
    expect(() => database.getDb()).toThrow("DATABASE_URL is not configured")
  })
})
