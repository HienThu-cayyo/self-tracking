import { NextResponse } from "next/server"

import { getCurrentUser } from "@/_entities/auth/index.server"
import { eq, getDb, googleCalendarConnections } from "@smart-base/database/server"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const connection = (
    await getDb()
      .select()
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.userId, user.id))
      .limit(1)
  )[0]
  return NextResponse.json({
    connected: Boolean(connection),
    selectedCalendarIds: connection?.selectedCalendarIds ?? [],
    keywords: connection?.keywords ?? [],
    lastSyncedAt: connection?.lastSyncedAt ?? null,
    syncError: connection?.syncError ?? null,
  })
}
