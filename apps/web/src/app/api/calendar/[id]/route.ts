import { NextResponse } from "next/server"

import { getCurrentUser } from "@/_entities/auth/index.server"
import { and, calendarEvents, eq, getDb } from "@smart-base/database/server"
import { parseEventBody } from "../route"

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: Context) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const { id } = await context.params
  const existing = (
    await getDb()
      .select({ source: calendarEvents.source })
      .from(calendarEvents)
      .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, user.id)))
      .limit(1)
  )[0]
  if (!existing) return NextResponse.json({ message: "Sự kiện không tồn tại" }, { status: 404 })
  if (existing.source === "google") {
    return NextResponse.json({ message: "Sự kiện Google Calendar chỉ được đọc" }, { status: 403 })
  }
  const parsed = parseEventBody((await request.json()) as Record<string, unknown>)
  if ("error" in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 })
  const event = (
    await getDb()
      .update(calendarEvents)
      .set({ ...parsed.values, updatedAt: new Date() })
      .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, user.id)))
      .returning()
  )[0]
  return NextResponse.json({ event })
}

export async function DELETE(_request: Request, context: Context) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const { id } = await context.params
  const existing = (
    await getDb()
      .select({ source: calendarEvents.source })
      .from(calendarEvents)
      .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, user.id)))
      .limit(1)
  )[0]
  if (!existing) return NextResponse.json({ message: "Sự kiện không tồn tại" }, { status: 404 })
  if (existing.source === "google") {
    return NextResponse.json({ message: "Sự kiện Google Calendar chỉ được đọc" }, { status: 403 })
  }
  await getDb()
    .delete(calendarEvents)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, user.id)))
  return NextResponse.json({ ok: true })
}
