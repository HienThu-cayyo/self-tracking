ALTER TABLE "calendar_events" ADD COLUMN "ends_at" timestamp with time zone;
ALTER TABLE "calendar_events" ADD COLUMN "all_day" boolean DEFAULT false NOT NULL;
ALTER TABLE "calendar_events" ADD COLUMN "location" text;
ALTER TABLE "calendar_events" ADD COLUMN "description" text;
ALTER TABLE "calendar_events" ADD COLUMN "event_type" text DEFAULT 'personal' NOT NULL;
ALTER TABLE "calendar_events" ADD COLUMN "reminder_minutes" integer DEFAULT 30 NOT NULL;
ALTER TABLE "calendar_events" ADD COLUMN "source" text DEFAULT 'local' NOT NULL;
ALTER TABLE "calendar_events" ADD COLUMN "external_id" text;
ALTER TABLE "calendar_events" ADD COLUMN "source_calendar_id" text;
UPDATE "calendar_events" SET "ends_at" = "starts_at" WHERE "ends_at" IS NULL;
ALTER TABLE "calendar_events" ALTER COLUMN "ends_at" SET NOT NULL;
CREATE UNIQUE INDEX "calendar_events_source_external_unique" ON "calendar_events" ("source", "external_id");
CREATE TABLE "google_calendar_connections" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "google_account_id" text NOT NULL,
  "access_token_encrypted" text NOT NULL,
  "refresh_token_encrypted" text NOT NULL,
  "token_expires_at" timestamp with time zone NOT NULL,
  "selected_calendar_ids" jsonb NOT NULL,
  "keywords" jsonb NOT NULL,
  "last_synced_at" timestamp with time zone,
  "sync_error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
