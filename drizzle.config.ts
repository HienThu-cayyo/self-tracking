import { defineConfig } from "drizzle-kit"

const databaseUrl = process.env.DATABASE_URL?.trim()
const command = process.argv[2]

if (command === "migrate" && !databaseUrl) {
  throw new Error("DATABASE_URL is required to apply Drizzle migrations")
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/database/src/schema/**/*.ts",
  out: "./drizzle",
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
  strict: true,
  verbose: true,
})
