import { NextResponse } from "next/server"

import { getCurrentUser } from "@/_entities/auth/index.server"
import {
  decryptGoogleToken,
  GOOGLE_KEYWORDS,
  refreshGoogleAccessToken,
} from "@/_entities/calendar/index.server"
import {
  and,
  calendarEvents,
  eq,
  getDb,
  googleCalendarConnections,
} from "@smart-base/database/server"

type GoogleCalendar = { id: string; summary?: string; primary?: boolean }
type GoogleEvent = {
  id: string
  summary?: string
  description?: string
  location?: string
  start?: { date?: string; dateTime?: string }
  end?: { date?: string; dateTime?: string }
}

function matchesKeywords(event: GoogleEvent, keywords: string[]) {
  const haystack = `${event.summary ?? ""} ${event.description ?? ""}`.toLocaleLowerCase()
  return keywords.some((keyword) => haystack.includes(keyword.toLocaleLowerCase()))
}

function inferEventType(event: GoogleEvent) {
  const text = `${event.summary ?? ""} ${event.description ?? ""}`.toLocaleLowerCase()
  if (text.includes("thi") || text.includes("exam") || text.includes("kiểm tra")) return "exam"
  if (text.includes("deadline")) return "deadline"
  if (text.includes("event")) return "event"
  return "personal"
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const db = getDb()
  const connection = (
    await db
      .select()
      .from(googleCalendarConnections)
      .where(eq(googleCalendarConnections.userId, user.id))
      .limit(1)
  )[0]
  if (!connection)
    return NextResponse.json({ message: "Chưa kết nối Google Calendar" }, { status: 400 })

  const body = (await request.json().catch(() => ({}))) as {
    selectedCalendarIds?: unknown
    keywords?: unknown
  }
  const selectedCalendarIds = Array.isArray(body.selectedCalendarIds)
    ? body.selectedCalendarIds.map(String).filter(Boolean)
    : Array.isArray(connection.selectedCalendarIds)
      ? connection.selectedCalendarIds.map(String)
      : []
  const keywords = Array.isArray(body.keywords)
    ? body.keywords
        .map(String)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20)
    : Array.isArray(connection.keywords)
      ? connection.keywords.map(String)
      : GOOGLE_KEYWORDS
  try {
    const token = await refreshGoogleAccessToken(
      decryptGoogleToken(connection.refreshTokenEncrypted),
    )
    const headers = { authorization: `Bearer ${token.access_token}` }
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      { headers },
    )
    if (!calendarResponse.ok) throw new Error("Không thể đọc danh sách Google Calendar")
    const calendars = ((await calendarResponse.json()) as { items?: GoogleCalendar[] }).items ?? []
    const ids = selectedCalendarIds.length
      ? selectedCalendarIds
      : calendars.map((calendar) => calendar.id)
    const now = new Date()
    const until = new Date(now)
    until.setDate(until.getDate() + 90)
    let imported = 0
    for (const calendarId of ids) {
      const params = new URLSearchParams({
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
        timeMin: now.toISOString(),
        timeMax: until.toISOString(),
      })
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers },
      )
      if (!response.ok) continue
      const googleEvents = ((await response.json()) as { items?: GoogleEvent[] }).items ?? []
      for (const event of googleEvents.filter(
        (item) => item.id && matchesKeywords(item, keywords),
      )) {
        const allDay = Boolean(event.start?.date)
        const startsAt = allDay
          ? new Date(`${event.start?.date}T00:00:00.000Z`)
          : new Date(event.start?.dateTime ?? "")
        const endsAt = allDay
          ? new Date(`${event.end?.date ?? event.start?.date}T00:00:00.000Z`)
          : new Date(event.end?.dateTime ?? event.start?.dateTime ?? "")
        if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) continue
        await db
          .insert(calendarEvents)
          .values({
            id: `google_${user.id}_${calendarId}_${event.id}`,
            userId: user.id,
            title: event.summary?.trim() || "Sự kiện Google Calendar",
            startsAt,
            endsAt,
            allDay,
            location: event.location ?? null,
            description: event.description ?? null,
            eventType: inferEventType(event),
            reminderMinutes: 30,
            source: "google",
            externalId: event.id,
            sourceCalendarId: calendarId,
          })
          .onConflictDoUpdate({
            target: [calendarEvents.source, calendarEvents.externalId],
            set: {
              title: event.summary?.trim() || "Sự kiện Google Calendar",
              startsAt,
              endsAt,
              location: event.location ?? null,
              description: event.description ?? null,
              updatedAt: new Date(),
            },
          })
        imported += 1
      }
    }
    await db
      .update(googleCalendarConnections)
      .set({
        accessTokenEncrypted: connection.accessTokenEncrypted,
        selectedCalendarIds: ids,
        keywords,
        lastSyncedAt: new Date(),
        syncError: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(googleCalendarConnections.userId, user.id),
          eq(googleCalendarConnections.googleAccountId, connection.googleAccountId),
        ),
      )
    return NextResponse.json({ imported, calendars })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể đồng bộ Google Calendar"
    await db
      .update(googleCalendarConnections)
      .set({ syncError: message, updatedAt: new Date() })
      .where(eq(googleCalendarConnections.userId, user.id))
    return NextResponse.json({ message }, { status: 502 })
  }
}
