import { describe, expect, it } from "vitest"

import { readDatabaseUrl } from "./database-url"

describe("readDatabaseUrl", () => {
  it("requires a non-empty database URL", () => {
    expect(() => readDatabaseUrl({})).toThrow("DATABASE_URL is not configured")
    expect(() => readDatabaseUrl({ DATABASE_URL: "   " })).toThrow("DATABASE_URL is not configured")
  })

  it("trims a configured database URL", () => {
    expect(readDatabaseUrl({ DATABASE_URL: " postgres://localhost/app " })).toBe(
      "postgres://localhost/app",
    )
  })
})
