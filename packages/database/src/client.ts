import "server-only"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { readDatabaseUrl } from "./database-url"
import * as schema from "./schema"

function createDatabase(url: string) {
  const client = postgres(url, { max: 1, prepare: false })
  return drizzle(client, { schema })
}

let database: ReturnType<typeof createDatabase> | undefined

export function getDb() {
  if (database) return database

  database = createDatabase(readDatabaseUrl(process.env))
  return database
}

export type Database = ReturnType<typeof createDatabase>
