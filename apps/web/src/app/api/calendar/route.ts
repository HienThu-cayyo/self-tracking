import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"

import { getCurrentUser } from "@/_entities/auth/index.server"
import { and, calendarEvents, eq, getDb, gte, lte } from "@smart-base/database/server"

const eventTypes = new Set(["exam", "deadline", "event", "study", "personal"])

function parseEventBody(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim()
  const allDay = body.allDay === true
  const startsAt = String(body.startsAt ?? "")
  const endsAt = String(body.endsAt ?? "")
  const eventType = String(body.eventType ?? "personal")
  const start = allDay ? new Date(`${startsAt}T00:00:00.000Z`) : new Date(startsAt)
  const end = allDay ? new Date(`${endsAt}T00:00:00.000Z`) : new Date(endsAt)
  if (!title || title.length > 200 || !startsAt || !endsAt || Number.isNaN(start.getTime())) {
    return { error: "Tiêu đề và thời gian bắt đầu là bắt buộc" }
  }
  if (Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) {
    return { error: "Thời gian kết thúc phải sau thời gian bắt đầu" }
  }
  if (!eventTypes.has(eventType)) return { error: "Loại sự kiện không hợp lệ" }
  const reminderMinutes = Number(body.reminderMinutes ?? 30)
  if (!Number.isInteger(reminderMinutes) || reminderMinutes < 0 || reminderMinutes > 10080) {
    return { error: "Thời gian nhắc nhở không hợp lệ" }
  }
  return {
    values: {
      title,
      startsAt: start,
      endsAt: end,
      allDay,
      location: String(body.location ?? "").trim() || null,
      description: String(body.description ?? "").trim() || null,
      eventType,
      reminderMinutes,
    },
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const url = new URL(request.url)
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")
  const eventType = url.searchParams.get("type")
  const filters = [eq(calendarEvents.userId, user.id)]
  if (from) filters.push(gte(calendarEvents.startsAt, new Date(from)))
  if (to) filters.push(lte(calendarEvents.startsAt, new Date(to)))
  if (eventType && eventTypes.has(eventType)) filters.push(eq(calendarEvents.eventType, eventType))
  const events = await getDb()
    .select()
    .from(calendarEvents)
    .where(and(...filters))
    .orderBy(calendarEvents.startsAt)
  return NextResponse.json({ events })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const body = (await request.json()) as Record<string, unknown>
  const parsed = parseEventBody(body)
  if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 })
  const event = (
    await getDb()
      .insert(calendarEvents)
      .values({
        id: randomUUID(),
        userId: user.id,
        ...parsed.values,
        source: "local",
        externalId: null,
        sourceCalendarId: null,
      })
      .returning()
  )[0]
  return NextResponse.json({ event }, { status: 201 })
}

export { parseEventBody }
