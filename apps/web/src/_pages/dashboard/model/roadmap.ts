export type RoadmapDeadlineState =
  | { kind: "none"; label: string }
  | { kind: "today"; label: string }
  | { kind: "upcoming"; label: string; days: number }
  | { kind: "overdue"; label: string; days: number }

const NUMBERED_LESSON_PATTERN =
  /(?:^|\s)(?:(?:chapter|lesson)\s*\d+\s*[:.)-]?|\d{1,3}\s*[.)-])\s*/gi

function cleanLessonTitle(value: string) {
  return value
    .replace(/^\s*(?:[-*•]\s*)?/, "")
    .replace(/^(?:(?:bài|chapter|lesson)\s*\d+\s*[:.)-]?|\d{1,3}\s*[.)-])\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/,+$/, "")
    .trim()
}

function splitNumberedLine(line: string): string[] {
  if (line.includes(",")) return line.split(",").flatMap(splitNumberedLine)
  const matches = [...line.matchAll(NUMBERED_LESSON_PATTERN)]
  if (!matches.length) return line.split(",")
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? line.length
    return line.slice(start, end)
  })
}

export function parseLessonList(input: string) {
  const normalized = input.replace(/\r\n?/g, "\n").trim()
  if (!normalized) return []

  const lines = normalized.split("\n")
  const candidates = lines.flatMap(splitNumberedLine)

  const seen = new Set<string>()
  return candidates.map(cleanLessonTitle).filter((title) => {
    const key = title.toLocaleLowerCase()
    if (!title || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function getRoadmapDeadlineState(
  deadline: string | null | undefined,
  today = new Date(),
): RoadmapDeadlineState {
  if (!deadline) return { kind: "none", label: "Chưa đặt ngày đích" }
  const target = parseDateKey(deadline)
  if (!target || Number.isNaN(target.getTime()))
    return { kind: "none", label: "Ngày đích không hợp lệ" }

  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((target.getTime() - current.getTime()) / 86_400_000)
  if (days === 0) return { kind: "today", label: "Hôm nay là hạn" }
  if (days > 0) return { kind: "upcoming", days, label: `Còn ${days} ngày` }
  return { kind: "overdue", days: Math.abs(days), label: `Đã quá hạn ${Math.abs(days)} ngày` }
}

export function calculateLessonProgress(lessons: Array<{ done: boolean }>, fallback = 0) {
  if (!lessons.length) return fallback
  return Math.round((lessons.filter((lesson) => lesson.done).length / lessons.length) * 100)
}
