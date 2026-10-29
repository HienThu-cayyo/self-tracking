import { getTableConfig } from "drizzle-orm/pg-core"
import { describe, expect, it } from "vitest"

import * as schema from "."

describe("database schema", () => {
  it("builds every table configuration without a database connection", () => {
    const tables = [
      schema.users,
      schema.sessions,
      schema.emailVerificationTokens,
      schema.passwordResetTokens,
      schema.tasks,
      schema.roadmaps,
      schema.lessons,
      schema.subjects,
      schema.calendarEvents,
      schema.googleCalendarConnections,
      schema.dailyFocusLogs,
      schema.focusTimerState,
    ]

    const configs = tables.map((table) => getTableConfig(table))
    configs.forEach((config) => config.foreignKeys.forEach((foreignKey) => foreignKey.getName()))

    expect(configs.map((config) => config.name)).toEqual([
      "users",
      "sessions",
      "email_verification_tokens",
      "password_reset_tokens",
      "tasks",
      "roadmaps",
      "lessons",
      "subjects",
      "calendar_events",
      "google_calendar_connections",
      "daily_focus_logs",
      "focus_timer_state",
    ])
  })
})
