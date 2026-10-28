import { NextResponse } from "next/server"

import { getCurrentUser } from "@/_entities/auth/index.server"
import {
  and,
  calendarEvents,
  eq,
  getDb,
  googleCalendarConnections,
} from "@smart-base/database/server"

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const db = getDb()
  await db
    .delete(calendarEvents)
    .where(and(eq(calendarEvents.userId, user.id), eq(calendarEvents.source, "google")))
  await db.delete(googleCalendarConnections).where(eq(googleCalendarConnections.userId, user.id))
  return NextResponse.json({ ok: true })
}
