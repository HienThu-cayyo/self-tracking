import { NextResponse } from "next/server"

import { getCurrentUser } from "@/_entities/auth/index.server"
import { decryptGoogleToken, refreshGoogleAccessToken } from "@/_entities/calendar/index.server"
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
  if (!connection)
    return NextResponse.json({ message: "Chưa kết nối Google Calendar" }, { status: 400 })
  try {
    const token = await refreshGoogleAccessToken(
      decryptGoogleToken(connection.refreshTokenEncrypted),
    )
    const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { authorization: `Bearer ${token.access_token}` },
    })
    if (!response.ok) throw new Error("Không thể đọc danh sách Google Calendar")
    const data = (await response.json()) as {
      items?: Array<{ id: string; summary?: string; primary?: boolean }>
    }
    return NextResponse.json({ calendars: data.items ?? [] })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Không thể đọc calendar" },
      { status: 502 },
    )
  }
}
