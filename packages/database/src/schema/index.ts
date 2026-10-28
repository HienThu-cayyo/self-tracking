import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  currentGpa: real("current_gpa"),
  targetGpa: real("target_gpa"),
  ...timestamps,
})

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
})

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
})

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
})

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  due: text("due").notNull(),
  priority: text("priority").notNull(),
  done: boolean("done").default(false).notNull(),
  ...timestamps,
})

export const roadmaps = pgTable("roadmaps", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  goal: text("goal").notNull(),
  deadline: date("deadline", { mode: "string" }),
  progress: integer("progress").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(),
  ...timestamps,
})

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  roadmapId: text("roadmap_id")
    .notNull()
    .references(() => roadmaps.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  done: boolean("done").default(false).notNull(),
  ...timestamps,
})

export const subjects = pgTable("subjects", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code").notNull(),
  credits: integer("credits").default(0).notNull(),
  semester: text("semester").notNull(),
  completed: boolean("completed").default(false).notNull(),
  ...timestamps,
})

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    allDay: boolean("all_day").default(false).notNull(),
    location: text("location"),
    description: text("description"),
    eventType: text("event_type").default("personal").notNull(),
    reminderMinutes: integer("reminder_minutes").default(30).notNull(),
    source: text("source").default("local").notNull(),
    externalId: text("external_id"),
    sourceCalendarId: text("source_calendar_id"),
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (table) => ({
    externalEvent: unique("calendar_events_source_external_unique").on(
      table.source,
      table.externalId,
    ),
  }),
)

export const googleCalendarConnections = pgTable("google_calendar_connections", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  googleAccountId: text("google_account_id").notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
  selectedCalendarIds: jsonb("selected_calendar_ids").notNull(),
  keywords: jsonb("keywords").notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  syncError: text("sync_error"),
  ...timestamps,
})

export const dailyFocusLogs = pgTable("daily_focus_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  seconds: integer("seconds").default(0).notNull(),
  ...timestamps,
})

export const focusTimerState = pgTable("focus_timer_state", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  taskId: text("task_id"),
  durationSeconds: integer("duration_seconds").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  accumulatedSeconds: integer("accumulated_seconds").default(0).notNull(),
  ...timestamps,
})
