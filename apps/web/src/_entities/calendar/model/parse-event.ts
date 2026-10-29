const eventTypes = new Set(["exam", "deadline", "event", "study", "personal"])

export function parseEventBody(body: Record<string, unknown>) {
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
