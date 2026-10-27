import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { getCurrentUser } from "@/_entities/auth/index.server"
import {
  and,
  eq,
  getDb,
  lessons,
  roadmaps,
  subjects,
  tasks,
  users,
} from "@smart-base/database/server"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const db = getDb()
  const [allTasks, userTasks, userRoadmaps, userSubjects, userLessons] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.userId, user.id)),
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, user.id), eq(tasks.done, false))),
    db.select().from(roadmaps).where(eq(roadmaps.userId, user.id)),
    db.select().from(subjects).where(eq(subjects.userId, user.id)),
    db
      .select({
        id: lessons.id,
        roadmapId: lessons.roadmapId,
        title: lessons.title,
        done: lessons.done,
      })
      .from(lessons)
      .innerJoin(roadmaps, eq(roadmaps.id, lessons.roadmapId))
      .where(eq(roadmaps.userId, user.id)),
  ])
  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter((task) => task.done).length
  const totalCredits = userSubjects.reduce((total, subject) => total + subject.credits, 0)
  const completedCredits = userSubjects
    .filter((subject) => subject.completed)
    .reduce((total, subject) => total + subject.credits, 0)
  const learningProgressPercent = userRoadmaps.length
    ? Math.round(
        userRoadmaps.reduce((total, roadmap) => total + roadmap.progress, 0) / userRoadmaps.length,
      )
    : 0
  return NextResponse.json({
    tasks: userTasks,
    completedTasks: allTasks.filter((task) => task.done),
    courses: userRoadmaps.map((roadmap) => ({
      ...roadmap,
      lessons: userLessons.filter((lesson) => lesson.roadmapId === roadmap.id),
    })),
    subjects: userSubjects,
    summary: {
      learningProgressPercent,
      completedTasks,
      totalTasks,
      currentGpa: user.currentGpa,
      targetGpa: user.targetGpa,
      completedCredits,
      totalCredits,
    },
  })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const body = (await request.json()) as {
    action?: unknown
    id?: unknown
    title?: unknown
    due?: unknown
    priority?: unknown
    goal?: unknown
    progress?: unknown
    roadmapId?: unknown
    titles?: unknown
    lessonId?: unknown
    name?: unknown
    code?: unknown
    credits?: unknown
    semester?: unknown
    subjectId?: unknown
    currentGpa?: unknown
    targetGpa?: unknown
  }
  const db = getDb()
  if (body.action === "update-gpa") {
    const parseGpa = (value: unknown) => {
      if (value === null || value === "") return null
      const parsed = Number(value)
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 4 ? parsed : undefined
    }
    const currentGpa = parseGpa(body.currentGpa)
    const targetGpa = parseGpa(body.targetGpa)
    if (currentGpa === undefined || targetGpa === undefined) {
      return NextResponse.json({ message: "GPA phải nằm trong khoảng 0 đến 4" }, { status: 400 })
    }
    await db
      .update(users)
      .set({ currentGpa, targetGpa, updatedAt: new Date() })
      .where(eq(users.id, user.id))
    return NextResponse.json({ currentGpa, targetGpa })
  }
  if (body.action === "create-task") {
    const title = String(body.title ?? "").trim()
    if (!title) return NextResponse.json({ message: "Tên công việc là bắt buộc" }, { status: 400 })
    const created = (
      await db
        .insert(tasks)
        .values({
          id: randomUUID(),
          userId: user.id,
          title,
          subject: "Cá nhân",
          due: String(body.due ?? "Chưa đặt thời gian"),
          priority: String(body.priority ?? "Vừa"),
          done: false,
        })
        .returning()
    )[0]
    return NextResponse.json({ task: created }, { status: 201 })
  }
  if (body.action === "complete-task" || body.action === "restore-task") {
    const id = String(body.id ?? "")
    await db
      .update(tasks)
      .set({ done: body.action === "complete-task", updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    return NextResponse.json({ ok: true })
  }
  if (body.action === "delete-task") {
    const id = String(body.id ?? "")
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    return NextResponse.json({ ok: true })
  }
  if (body.action === "create-course") {
    const title = String(body.title ?? "").trim()
    if (!title) return NextResponse.json({ message: "Tên lộ trình là bắt buộc" }, { status: 400 })
    const course = (
      await db
        .insert(roadmaps)
        .values({
          id: randomUUID(),
          userId: user.id,
          title,
          goal: String(body.goal ?? "Lộ trình mới"),
          progress: Number(body.progress ?? 0),
          featured: false,
        })
        .returning()
    )[0]
    return NextResponse.json({ course }, { status: 201 })
  }
  if (body.action === "add-lessons") {
    const roadmapId = String(body.roadmapId ?? "")
    const roadmap = (
      await db
        .select({ id: roadmaps.id })
        .from(roadmaps)
        .where(and(eq(roadmaps.id, roadmapId), eq(roadmaps.userId, user.id)))
        .limit(1)
    )[0]
    const titles = Array.isArray(body.titles)
      ? body.titles
          .map(String)
          .map((title) => title.trim())
          .filter(Boolean)
      : []
    if (!roadmap || !titles.length)
      return NextResponse.json({ message: "Lộ trình hoặc bài học không hợp lệ" }, { status: 400 })
    await db
      .insert(lessons)
      .values(titles.map((title) => ({ id: randomUUID(), roadmapId, title, done: false })))
    return NextResponse.json({ ok: true })
  }
  if (body.action === "toggle-lesson") {
    const lessonId = String(body.lessonId ?? "")
    const lesson = (
      await db
        .select({ id: lessons.id, done: lessons.done, roadmapId: lessons.roadmapId })
        .from(lessons)
        .innerJoin(roadmaps, eq(roadmaps.id, lessons.roadmapId))
        .where(and(eq(lessons.id, lessonId), eq(roadmaps.userId, user.id)))
        .limit(1)
    )[0]
    if (!lesson) return NextResponse.json({ message: "Bài học không tồn tại" }, { status: 404 })
    await db
      .update(lessons)
      .set({ done: !lesson.done, updatedAt: new Date() })
      .where(eq(lessons.id, lesson.id))
    return NextResponse.json({ ok: true })
  }
  if (body.action === "create-subject") {
    const name = String(body.name ?? "").trim()
    if (!name) return NextResponse.json({ message: "Tên môn học là bắt buộc" }, { status: 400 })
    const subject = (
      await db
        .insert(subjects)
        .values({
          id: randomUUID(),
          userId: user.id,
          name,
          code: String(body.code ?? ""),
          credits: Number(body.credits ?? 0),
          semester: String(body.semester ?? "Học kỳ 1"),
          completed: false,
        })
        .returning()
    )[0]
    return NextResponse.json({ subject }, { status: 201 })
  }
  if (body.action === "toggle-subject") {
    const subjectId = String(body.subjectId ?? "")
    const subject = (
      await db
        .select({ id: subjects.id, completed: subjects.completed })
        .from(subjects)
        .where(and(eq(subjects.id, subjectId), eq(subjects.userId, user.id)))
        .limit(1)
    )[0]
    if (!subject) return NextResponse.json({ message: "Môn học không tồn tại" }, { status: 404 })
    await db
      .update(subjects)
      .set({ completed: !subject.completed, updatedAt: new Date() })
      .where(eq(subjects.id, subject.id))
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ message: "Action không hợp lệ" }, { status: 400 })
}
