import { afterEach, describe, expect, it, vi } from "vitest"

const originalDatabaseUrl = process.env.DATABASE_URL

afterEach(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = originalDatabaseUrl
})

describe("getDb", () => {
  it("does not require DATABASE_URL until the database is requested", async () => {
    delete process.env.DATABASE_URL
    vi.resetModules()

    const database = await import("./client")

    expect(() => database.getDb()).toThrow("DATABASE_URL is not configured")
  })

  it("reuses one database instance per process", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/smart_base_test"
    vi.resetModules()

    const database = await import("./client")
    expect(database.getDb()).toBe(database.getDb())
  })

  it("creates a lazy client without opening a network connection", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@127.0.0.1:1/smart_base_test"
    vi.resetModules()

    const database = await import("./client")

    expect(database.getDb()).toBeDefined()
  })
})
