"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  advanceFocusTimer,
  calculateCurrentStreak,
  DAILY_FOCUS_GOAL_SECONDS,
  type DailyFocusLog,
  getFocusLogsSnapshot,
  getFocusTimerSnapshot,
  getServerFocusLogsSnapshot,
  getServerFocusTimerSnapshot,
  getTimerRemainingSeconds,
  getTodayFocusSeconds,
  getWeekDays,
  type PersistedFocusTimer,
  pauseFocusTimer,
  setFocusTimer,
  subscribeToFocusLogs,
  subscribeToFocusTimer,
} from "../model/streak"
import {
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Flower2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Pause,
  Pencil,
  Play,
  Plus,
  Route,
  RotateCcw,
  Search,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { EMPTY_DASHBOARD_SUMMARY, getDailyQuotes, type DashboardSummary } from "../model/dashboard"
import {
  CompactKpiGrid,
  DashboardEmptyState,
  DashboardHero,
  DashboardSectionHeader,
  DailyFocusCard,
  StreakFlower,
  WeeklyInsightStrip,
  summaryIcons,
} from "./dashboard-widgets"
import { calculateLessonProgress, getRoadmapDeadlineState, parseLessonList } from "../model/roadmap"
import { groupTasksByPriority, sortTasksByPriority } from "../model/tasks"
import { playTimerCompletionSound, prepareTimerCompletionSound } from "../model/timer-sound"
import {
  clearGuestSnapshot,
  getGuestImportDismissedKey,
  readGuestSnapshot,
  writeGuestSnapshot,
  type GuestSnapshot,
} from "../model/guest"
import { NotificationCenter } from "./notification-center"
import {
  EVENT_TYPE_LABELS,
  getEventDateKey,
  getLocalDateKey,
  getWeekDateKeys,
  isCalendarDateRangeValid,
  type CalendarEvent,
  sortCalendarEvents,
} from "../model/calendar"

export type Task = {
  id: number | string
  title: string
  subject: string
  due: string
  priority: "Cao" | "Vừa" | "Thấp"
  done: boolean
}

type Priority = Task["priority"]

type UndoTask = {
  task: Task
  index: number
}

type Course = {
  id: number | string
  title: string
  goal: string
  progress: number
  deadline: string | null
  lessons: Lesson[]
  featured?: boolean
}

type Lesson = {
  id: number | string
  title: string
  done: boolean
}

const navItems = [
  { label: "Tổng quan", icon: LayoutDashboard },
  { label: "Việc cần làm", icon: CheckCircle2 },
  { label: "Môn học", icon: BookOpen },
  { label: "Lộ trình", icon: Route },
  { label: "Lịch của tôi", icon: CalendarDays },
]

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Ôn chương 3: Cấu trúc dữ liệu",
    subject: "Cấu trúc dữ liệu",
    due: "Hôm nay, 18:00",
    priority: "Cao",
    done: false,
  },
  {
    id: 2,
    title: "Nộp bài tập lớn tuần 5",
    subject: "Lập trình Web",
    due: "Ngày mai, 23:59",
    priority: "Cao",
    done: false,
  },
  {
    id: 3,
    title: "Luyện Speaking Part 2",
    subject: "IELTS 7.0",
    due: "Thứ 5, 20:00",
    priority: "Vừa",
    done: true,
  },
  {
    id: 4,
    title: "Đọc tài liệu hệ điều hành",
    subject: "Hệ điều hành",
    due: "Thứ 6, 22:00",
    priority: "Thấp",
    done: false,
  },
]

type Subject = {
  id: number | string
  name: string
  code: string
  progress: number
  color: string
  detail: string
  credits: number
  semester: string
  completed: boolean
}

const initialSubjects: Subject[] = [
  {
    id: 1,
    name: "Cấu trúc dữ liệu",
    code: "CS201",
    progress: 72,
    color: "bg-[#D76B96]",
    detail: "3 / 4 chương",
    credits: 3,
    semester: "Học kỳ 1",
    completed: false,
  },
  {
    id: 2,
    name: "Lập trình Web",
    code: "CS302",
    progress: 58,
    color: "bg-[#D76B96]",
    detail: "5 / 8 chủ đề",
    credits: 3,
    semester: "Học kỳ 1",
    completed: false,
  },
  {
    id: 3,
    name: "Hệ điều hành",
    code: "CS204",
    progress: 41,
    color: "bg-[#D76B96]",
    detail: "2 / 5 chương",
    credits: 4,
    semester: "Học kỳ 2",
    completed: false,
  },
]

const priorityStyles = {
  Cao: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
  Vừa: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  Thấp: "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400",
}

const priorityColumnStyles = {
  Cao: "border-rose-200/80 bg-rose-50/45 dark:border-rose-400/20 dark:bg-rose-500/[0.06]",
  Vừa: "border-[#F5A9C4]/70 bg-[#FCE7EF]/45 dark:border-[#F5A9C4]/20 dark:bg-[#F5A9C4]/[0.06]",
  Thấp: "border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.025]",
}

const priorityColumnLabels = {
  Cao: "Khẩn cấp",
  Vừa: "Vừa",
  Thấp: "Thấp",
}

const initialCourses: Course[] = [
  {
    id: 1,
    title: "IELTS 7.0",
    goal: "Mục tiêu trước tháng 12, 2024",
    progress: 46,
    deadline: null,
    lessons: [
      { id: 101, title: "Listening: Multiple Choice", done: true },
      { id: 102, title: "Reading: True / False / Not Given", done: false },
      { id: 103, title: "Speaking Part 2", done: false },
    ],
    featured: true,
  },
  {
    id: 2,
    title: "Frontend Developer",
    goal: "Lộ trình kỹ năng cá nhân",
    progress: 12,
    deadline: null,
    lessons: [],
  },
]

function getStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark"
  const savedTheme = window.localStorage.getItem("self-track-theme")
  return savedTheme === "light" ? "light" : "dark"
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("self-track-theme-change", onChange)
  return () => window.removeEventListener("self-track-theme-change", onChange)
}

let liveTimestamp = 0
const clockSubscribers = new Set<() => void>()
let clockInterval: ReturnType<typeof setInterval> | null = null

function subscribeToClock(onChange: () => void) {
  clockSubscribers.add(onChange)
  if (clockSubscribers.size === 1) {
    liveTimestamp = Date.now()
    clockInterval = setInterval(() => {
      liveTimestamp = Date.now()
      clockSubscribers.forEach((subscriber) => subscriber())
    }, 1000)
  }

  return () => {
    clockSubscribers.delete(onChange)
    if (clockSubscribers.size === 0 && clockInterval) {
      clearInterval(clockInterval)
      clockInterval = null
    }
  }
}

function getClockSnapshot() {
  return liveTimestamp
}

export function DashboardPage() {
  const [activeNav, setActiveNav] = useState("Tổng quan")
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, () => "dark")
  const timestamp = useSyncExternalStore(subscribeToClock, getClockSnapshot, () => 0)
  const focusLogs = useSyncExternalStore(
    subscribeToFocusLogs,
    getFocusLogsSnapshot,
    getServerFocusLogsSnapshot,
  )
  const focusTimer = useSyncExternalStore(
    subscribeToFocusTimer,
    getFocusTimerSnapshot,
    getServerFocusTimerSnapshot,
  )
  const [tasks, setTasks] = useState(initialTasks.filter((task) => !task.done))
  const [completedTasks, setCompletedTasks] = useState(initialTasks.filter((task) => task.done))
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("Vừa")
  const [courses, setCourses] = useState(initialCourses)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourse, setNewCourse] = useState("")
  const [newCourseGoal, setNewCourseGoal] = useState("")
  const [newCourseDeadline, setNewCourseDeadline] = useState("")
  const [subjects, setSubjects] = useState(initialSubjects)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [undoTask, setUndoTask] = useState<UndoTask | null>(null)
  const [userName, setUserName] = useState("Minh Nguyễn")
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [authStatus, setAuthStatus] = useState<"checking" | "guest" | "authenticated">("checking")
  const [guestHydrated, setGuestHydrated] = useState(false)
  const [guestDirty, setGuestDirty] = useState(false)
  const [guestImportSnapshot, setGuestImportSnapshot] = useState<GuestSnapshot | null>(null)
  const [guestImporting, setGuestImporting] = useState(false)
  const [guestImportError, setGuestImportError] = useState("")
  const [summary, setSummary] = useState<DashboardSummary>({
    ...EMPTY_DASHBOARD_SUMMARY,
    completedTasks: initialTasks.filter((task) => task.done).length,
    totalTasks: initialTasks.length,
  })
  const undoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    void fetch("/api/auth/me")
      .then(async (response) => ({
        authenticated: response.ok,
        data: response.ok
          ? ((await response.json()) as { user?: { id?: string; name?: string; email?: string } })
          : null,
      }))
      .then(({ authenticated, data }) => {
        if (!authenticated || !data?.user) {
          setAuthStatus("guest")
          return
        }
        if (data.user.id) setUserId(data.user.id)
        if (data.user.name) setUserName(data.user.name)
        if (data.user.email) setUserEmail(data.user.email)
        setAuthStatus("authenticated")
      })
      .catch(() => setAuthStatus("guest"))
  }, [])

  useEffect(() => {
    if (authStatus === "checking") return
    if (authStatus === "guest") {
      const snapshot = readGuestSnapshot()
      if (!snapshot?.dirty) {
        clearGuestSnapshot()
        window.localStorage.removeItem("self-track-focus-logs")
        window.localStorage.removeItem("self-track-focus-timer")
        queueMicrotask(() => {
          setTasks([])
          setCompletedTasks([])
          setCourses([])
          setSubjects([])
          setCalendarEvents([])
          setSummary(EMPTY_DASHBOARD_SUMMARY)
          setGuestHydrated(true)
        })
        return
      }
      if (snapshot) {
        queueMicrotask(() => {
          setTasks(snapshot.tasks)
          setCompletedTasks(snapshot.completedTasks)
          setCourses(snapshot.courses)
          setSubjects(snapshot.subjects)
          setCalendarEvents(sortCalendarEvents(snapshot.events))
          setSummary(snapshot.summary)
          setGuestDirty(snapshot.dirty)
          setGuestHydrated(true)
        })
      } else {
        queueMicrotask(() => setGuestHydrated(true))
      }
      return
    }

    queueMicrotask(() => {
      setGuestHydrated(false)
      setTasks([])
      setCompletedTasks([])
      setCourses([])
      setSubjects([])
      setCalendarEvents([])
      setSummary(EMPTY_DASHBOARD_SUMMARY)
    })
    void fetch("/api/dashboard")
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          data: {
            tasks?: Task[]
            completedTasks?: Task[]
            courses?: Array<{
              id: string
              title: string
              goal: string
              progress: number
              deadline: string | null
              featured: boolean
              lessons: Array<{ id: string; title: string; done: boolean }>
            }>
            subjects?: Array<{
              id: string
              name: string
              code: string
              credits: number
              semester: string
              completed: boolean
            }>
            events?: CalendarEvent[]
            summary?: DashboardSummary
          } | null,
        ) => {
          if (data?.tasks) setTasks(data.tasks)
          if (data?.completedTasks) setCompletedTasks(data.completedTasks)
          if (data?.courses)
            setCourses(
              data.courses.map((course) => ({
                ...course,
                deadline: course.deadline ?? null,
                lessons: course.lessons.map((lesson) => ({
                  id: lesson.id,
                  title: lesson.title,
                  done: lesson.done,
                })),
              })),
            )
          if (data?.subjects)
            setSubjects(
              data.subjects.map((subject) => ({
                ...subject,
                progress: subject.completed ? 100 : 0,
                detail: "Chưa cập nhật",
                color: "bg-[#D76B96]",
              })),
            )
          if (data?.events) setCalendarEvents(sortCalendarEvents(data.events))
          if (data?.summary) setSummary(data.summary)
        },
      )
      .catch(() => undefined)
  }, [authStatus])

  useEffect(() => {
    if (authStatus !== "guest" || !guestHydrated) return
    writeGuestSnapshot({
      version: 1,
      dirty: guestDirty || focusLogs.length > 0 || Boolean(focusTimer),
      tasks,
      completedTasks,
      courses,
      subjects,
      events: calendarEvents,
      summary,
      focusLogs,
      focusTimer,
    })
  }, [
    authStatus,
    guestHydrated,
    guestDirty,
    focusLogs,
    focusTimer,
    tasks,
    completedTasks,
    courses,
    subjects,
    calendarEvents,
    summary,
  ])

  useEffect(() => {
    if (authStatus !== "authenticated" || !userId) return
    const snapshot = readGuestSnapshot()
    const dismissed = window.localStorage.getItem(getGuestImportDismissedKey(userId)) === "true"
    if (snapshot?.dirty && !dismissed) {
      queueMicrotask(() => setGuestImportSnapshot(snapshot))
    }
  }, [authStatus, userId])

  const syncDashboard = (body: Record<string, unknown>) => {
    if (authStatus !== "authenticated") return
    void fetch("/api/dashboard", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => undefined)
  }

  function markGuestDirty() {
    if (authStatus === "guest") setGuestDirty(true)
  }

  async function importGuestData() {
    if (!guestImportSnapshot || authStatus !== "authenticated") return
    setGuestImporting(true)
    setGuestImportError("")
    try {
      const response = await fetch("/api/dashboard/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(guestImportSnapshot),
      })
      const data = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(data.message ?? "Không thể lưu dữ liệu dùng thử")
      clearGuestSnapshot()
      window.localStorage.removeItem(getGuestImportDismissedKey(userId))
      setGuestImportSnapshot(null)
      window.location.reload()
    } catch (error) {
      setGuestImportError(error instanceof Error ? error.message : "Không thể lưu dữ liệu dùng thử")
    } finally {
      setGuestImporting(false)
    }
  }

  function dismissGuestImport() {
    if (userId) window.localStorage.setItem(getGuestImportDismissedKey(userId), "true")
    setGuestImportSnapshot(null)
  }

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function logout() {
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
    } finally {
      // Full navigation lets middleware re-check the cleared session cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login")
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem("self-track-theme", theme)
  }, [theme])

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark"
    window.localStorage.setItem("self-track-theme", nextTheme)
    window.dispatchEvent(new window.Event("self-track-theme-change"))
  }

  const remaining = useMemo(() => tasks.filter((task) => !task.done).length, [tasks])
  const orderedTasks = useMemo(() => sortTasksByPriority(tasks), [tasks])
  const orderedCompletedTasks = useMemo(() => sortTasksByPriority(completedTasks), [completedTasks])
  const currentTime = timestamp ? new Date(timestamp) : null
  const dailyQuotes = currentTime ? getDailyQuotes(currentTime) : null
  const focusAnchor = currentTime ?? new Date(2000, 0, 3)
  const greeting = authStatus === "guest" ? "sáng" : currentTime ? getGreeting(currentTime) : "sáng"
  const greetingName = authStatus === "guest" ? undefined : userName
  const dateLabel = currentTime ? formatLiveDate(currentTime) : "Đang cập nhật thời gian…"

  useEffect(() => {
    if (timestamp && focusTimer?.startedAt) advanceFocusTimer(timestamp)
  }, [focusTimer?.startedAt, timestamp])

  function toggleTask(id: number | string) {
    const taskToToggle = tasks.find((task) => task.id === id)
    if (!taskToToggle) return
    setSummary((current) => ({
      ...current,
      completedTasks: Math.max(0, current.completedTasks + 1),
      totalTasks: Math.max(current.totalTasks, tasks.length),
    }))
    if (undoTimeout.current) clearTimeout(undoTimeout.current)
    setUndoTask({ task: taskToToggle, index: tasks.findIndex((task) => task.id === id) })
    undoTimeout.current = setTimeout(() => setUndoTask(null), 5000)
    setTasks((current) => current.filter((item) => item.id !== id))
    setCompletedTasks((current) => [
      { ...taskToToggle, done: true },
      ...current.filter((item) => item.id !== id),
    ])
    markGuestDirty()
    syncDashboard({ action: "complete-task", id })
  }

  function undoCompletedTask() {
    if (!undoTask) return
    if (undoTimeout.current) clearTimeout(undoTimeout.current)
    setSummary((current) => ({
      ...current,
      completedTasks: Math.max(0, current.completedTasks - 1),
    }))
    setTasks((current) => {
      const next = [...current]
      next.splice(Math.min(undoTask.index, next.length), 0, { ...undoTask.task, done: false })
      return next
    })
    setCompletedTasks((current) => current.filter((task) => task.id !== undoTask.task.id))
    markGuestDirty()
    syncDashboard({ action: "restore-task", id: undoTask.task.id })
    setUndoTask(null)
  }

  function restoreCompletedTask(id: number | string) {
    const task = completedTasks.find((item) => item.id === id)
    if (!task) return
    setCompletedTasks((current) => current.filter((item) => item.id !== id))
    setTasks((current) => [{ ...task, done: false }, ...current])
    setSummary((current) => ({
      ...current,
      completedTasks: Math.max(0, current.completedTasks - 1),
    }))
    markGuestDirty()
    syncDashboard({ action: "restore-task", id })
  }

  function trashCompletedTask(id: number | string) {
    const task = completedTasks.find((item) => item.id === id)
    if (!task) return
    setCompletedTasks((current) => current.filter((item) => item.id !== id))
    setSummary((current) => ({
      ...current,
      completedTasks: Math.max(0, current.completedTasks - 1),
      totalTasks: Math.max(0, current.totalTasks - 1),
    }))
    markGuestDirty()
    syncDashboard({ action: "delete-task", id })
  }

  function addTaskDetails(title: string, priority: Priority) {
    if (!title.trim()) return
    setSummary((current) => ({ ...current, totalTasks: current.totalTasks + 1 }))
    setTasks((current) => [
      {
        id: Date.now(),
        title: title.trim(),
        subject: "Cá nhân",
        due: "Chưa đặt thời gian",
        priority,
        done: false,
      },
      ...current,
    ])
    markGuestDirty()
    syncDashboard({
      action: "create-task",
      title: title.trim(),
      due: "Chưa đặt thời gian",
      priority,
    })
  }

  function updateTask(id: number | string, title: string, priority: Priority) {
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, title: cleanTitle, priority } : task)),
    )
    setCompletedTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, title: cleanTitle, priority } : task)),
    )
    markGuestDirty()
    syncDashboard({ action: "update-task", id, title: cleanTitle, priority })
  }

  function addTask() {
    addTaskDetails(newTask, newTaskPriority)
    setNewTask("")
    setNewTaskPriority("Vừa")
    setShowAddTask(false)
  }

  function addCourse() {
    if (!newCourse.trim()) return

    setCourses((current) => [
      ...current,
      {
        id: Date.now(),
        title: newCourse.trim(),
        goal: newCourseGoal.trim() || "Lộ trình mới",
        progress: 0,
        deadline: newCourseDeadline || null,
        lessons: [],
      },
    ])
    markGuestDirty()
    syncDashboard({
      action: "create-course",
      title: newCourse.trim(),
      goal: newCourseGoal.trim() || "Lộ trình mới",
      deadline: newCourseDeadline || null,
    })
    setNewCourse("")
    setNewCourseGoal("")
    setNewCourseDeadline("")
    setShowAddCourse(false)
  }

  function addCourseFromRoadmap(title: string, goal: string, deadline: string | null) {
    setCourses((current) => [
      ...current,
      {
        id: Date.now(),
        title,
        goal: goal || "Lộ trình mới",
        progress: 0,
        deadline,
        lessons: [],
      },
    ])
    markGuestDirty()
    syncDashboard({
      action: "create-course",
      title,
      goal: goal || "Lộ trình mới",
      deadline,
    })
  }

  function updateCourseDeadline(courseId: number | string, deadline: string | null) {
    setCourses((current) =>
      current.map((course) => (course.id === courseId ? { ...course, deadline } : course)),
    )
    markGuestDirty()
    syncDashboard({ action: "update-roadmap-deadline", roadmapId: courseId, deadline })
  }

  function toggleSubjectCompletion(id: number | string) {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === id ? { ...subject, completed: !subject.completed } : subject,
      ),
    )
    markGuestDirty()
    syncDashboard({ action: "toggle-subject", subjectId: id })
  }

  function addSubject(subject: Omit<Subject, "id" | "completed">) {
    setSubjects((current) => [...current, { ...subject, id: Date.now(), completed: false }])
    markGuestDirty()
    syncDashboard({ action: "create-subject", ...subject })
  }

  function updateGpa(currentGpa: number | null, targetGpa: number | null) {
    setSummary((current) => ({ ...current, currentGpa, targetGpa }))
    markGuestDirty()
    syncDashboard({ action: "update-gpa", currentGpa, targetGpa })
  }

  function openFocusSession() {
    setActiveNav("Việc cần làm")
  }

  function setTaskTimer(taskId: number | string | null, minutes: number) {
    setFocusTimer({
      taskId,
      durationSeconds: Math.min(240, Math.max(1, minutes)) * 60,
      elapsedSeconds: 0,
      startedAt: null,
      lastAccountedAt: null,
    })
    markGuestDirty()
  }

  function startTaskTimer(taskId: number | string | null) {
    const current = focusTimer?.taskId === taskId ? focusTimer : null
    const durationSeconds = current?.durationSeconds || 25 * 60
    const now = Date.now()
    const elapsedSeconds =
      current && current.elapsedSeconds < current.durationSeconds ? current.elapsedSeconds : 0
    setFocusTimer({
      taskId,
      durationSeconds,
      elapsedSeconds,
      startedAt: now,
      lastAccountedAt: now,
    })
    prepareTimerCompletionSound()
    markGuestDirty()
  }

  function pauseTaskTimer() {
    pauseFocusTimer()
    markGuestDirty()
  }

  function resetTaskTimer() {
    setFocusTimer(null)
    markGuestDirty()
  }

  function toggleLesson(courseId: number | string, lessonId: number | string) {
    setCourses((current) =>
      current.map((course) => {
        if (course.id !== courseId) return course
        const lessons = course.lessons.map((lesson) =>
          lesson.id === lessonId ? { ...lesson, done: !lesson.done } : lesson,
        )
        return { ...course, lessons, progress: calculateLessonProgress(lessons, course.progress) }
      }),
    )
    markGuestDirty()
    syncDashboard({ action: "toggle-lesson", roadmapId: courseId, lessonId })
  }

  function addLessons(courseId: number | string, titles: string[]) {
    setCourses((current) =>
      current.map((course) => {
        if (course.id !== courseId) return course
        const lessons = [
          ...course.lessons,
          ...titles.map((title, index) => ({
            id: Date.now() + index,
            title,
            done: false,
          })),
        ]
        return { ...course, lessons, progress: calculateLessonProgress(lessons, course.progress) }
      }),
    )
    markGuestDirty()
    syncDashboard({ action: "add-lessons", roadmapId: courseId, titles })
  }

  const weekDays = getWeekDays(focusLogs, focusAnchor)
  const currentStreak = calculateCurrentStreak(focusLogs, focusAnchor)
  const todayMinutes = Math.floor(getTodayFocusSeconds(focusLogs, focusAnchor) / 60)
  const weeklyMinutes = Math.floor(weekDays.reduce((total, day) => total + day.seconds, 0) / 60)
  const weeklySessions = weekDays.filter((day) => day.seconds > 0).length
  const priorityTask = orderedTasks.find((task) => !task.done)
  const weeklyInsight =
    weeklySessions === 0
      ? "Bắt đầu một phiên học ngắn hôm nay để tạo nhịp cho cả tuần."
      : weeklySessions >= 4
        ? "Bạn đang giữ nhịp học rất tốt — hãy tiếp tục duy trì đà này."
        : `Bạn đã có ${weeklySessions} ngày học trong tuần này — thêm một phiên nữa để tiến gần mục tiêu.`

  return (
    <main className="dashboard-app min-h-dvh bg-[#fbf8f9] text-slate-900 dark:bg-[#11131a] dark:text-slate-100">
      <div className="flex min-h-dvh">
        <aside
          className={`${showMobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} fixed inset-y-0 left-0 z-30 flex w-[252px] flex-col border-r border-slate-200 bg-white px-5 py-6 transition-transform dark:border-white/8 dark:bg-[#171921]`}
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <span className="brand-mascot-frame flex size-10 items-center justify-center rounded-xl bg-[#FCE7EF] p-1 dark:bg-[#63465A]/45">
                <Image
                  src="/brand/self-track-mascot.png"
                  alt="Mascot Self-Track"
                  width={72}
                  height={59}
                  priority
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="text-lg font-bold tracking-tight text-[#63465A] dark:text-[#FFF9FB]">
                self<span className="text-[#D76B96]">.</span>track
              </span>
            </div>
            <button
              className="lg:hidden"
              onClick={() => setShowMobileNav(false)}
              aria-label="Đóng menu"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-10 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </div>
          <nav className="mt-3 space-y-1">
            {navItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => {
                  setActiveNav(label)
                  setShowMobileNav(false)
                }}
                className={`dashboard-focus flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${activeNav === label ? "bg-[#FCE7EF]/45 text-[#63465A] dark:bg-[#F5A9C4]/12 dark:text-pink-100" : "text-slate-500 hover:bg-[#fff4f6] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"}`}
              >
                <Icon className="size-[18px]" />
                {label}
                {label === "Việc cần làm" && (
                  <span className="ml-auto rounded-full bg-[#FCE7EF]/60 px-2 py-0.5 text-[10px] text-[#63465A] dark:bg-[#F5A9C4]/18 dark:text-pink-100">
                    {remaining}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="mt-auto">
            <StreakCard
              logs={focusLogs}
              now={currentTime}
              compact
              onOpenTasks={() => setActiveNav("Việc cần làm")}
            />
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5 dark:border-white/8">
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-rose-400 text-xs font-bold text-white">
              {authStatus === "guest" ? "G" : "MN"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {authStatus === "guest" ? "Chế độ dùng thử" : userName}
              </p>
              <p className="truncate text-xs text-slate-400">
                {authStatus === "guest" ? "Lưu trên thiết bị này" : userEmail || "Sinh viên"}
              </p>
            </div>
            {authStatus === "guest" ? (
              <Link
                href="/login"
                className="dashboard-focus ml-auto rounded-lg px-2 py-1.5 text-xs font-semibold text-[#D76B96] hover:bg-[#FCE7EF] dark:hover:bg-white/5"
              >
                Đăng nhập
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void logout()}
                disabled={isLoggingOut}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                aria-label="Đăng xuất"
                title="Đăng xuất"
              >
                <LogOut className="size-4" />
                <span>{isLoggingOut ? "Đang đăng xuất…" : "Đăng xuất"}</span>
              </button>
            )}
          </div>
        </aside>

        {showMobileNav && (
          <button
            className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden"
            onClick={() => setShowMobileNav(false)}
            aria-label="Đóng menu"
          />
        )}
        <section className="w-full lg:ml-[252px]">
          <header className="relative z-40 flex h-[72px] items-center justify-between border-b border-[#eadde2] bg-[#fffdfd]/85 px-5 backdrop-blur md:px-10 dark:border-white/8 dark:bg-[#11131a]/80">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden"
                onClick={() => setShowMobileNav(true)}
                aria-label="Mở menu"
              >
                <Menu className="size-5" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Tìm kiếm..."
                  className="dashboard-focus h-9 w-56 rounded-lg border border-transparent bg-slate-100 pl-9 text-sm outline-none placeholder:text-slate-400 focus:border-[#F5A9C4]/70 focus:ring-2 focus:ring-[#F5A9C4]/20 dark:bg-white/5"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
                title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
                className="dashboard-focus rounded-lg p-1.5 text-slate-400 transition hover:bg-[#fff1f4] hover:text-[#63465A] dark:hover:bg-white/5 dark:hover:text-white"
              >
                {theme === "dark" ? (
                  <Sun className="size-[18px]" />
                ) : (
                  <Moon className="size-[18px]" />
                )}
              </button>
              <NotificationCenter
                events={calendarEvents}
                courses={courses}
                now={timestamp}
                userId={userId}
                onNavigate={setActiveNav}
              />
              <div className="hidden h-5 w-px bg-slate-200 sm:block dark:bg-white/10" />
              <span className="text-sm text-slate-500 dark:text-slate-400">{dateLabel}</span>
            </div>
          </header>

          {authStatus === "guest" && (
            <div className="mx-auto mt-4 flex max-w-[1380px] items-center justify-between gap-3 rounded-xl border border-[#F5A9C4]/45 bg-[#FCE7EF]/55 px-4 py-3 text-xs text-[#63465A] shadow-sm dark:border-[#F5A9C4]/25 dark:bg-[#F5A9C4]/10 dark:text-[#FFF9FB] md:mx-10">
              <span>Bạn đang dùng thử — dữ liệu hiện chỉ lưu trên thiết bị này.</span>
              <Link
                href="/register"
                className="dashboard-focus shrink-0 rounded-lg bg-[#F5A9C4] px-3 py-1.5 font-semibold text-[#63465A] transition hover:bg-[#D76B96] hover:text-white"
              >
                Tạo tài khoản
              </Link>
            </div>
          )}

          {activeNav === "Việc cần làm" ? (
            <TaskListView
              tasks={orderedTasks}
              onToggle={toggleTask}
              onBack={() => setActiveNav("Tổng quan")}
              onAddTask={addTaskDetails}
              completedTasks={orderedCompletedTasks}
              onRestoreTask={restoreCompletedTask}
              onTrashTask={trashCompletedTask}
              onEditTask={updateTask}
              focusTimer={focusTimer}
              now={timestamp}
              timerQuote={dailyQuotes?.timer}
              onSetTimer={setTaskTimer}
              onStartTimer={startTaskTimer}
              onPauseTimer={pauseTaskTimer}
              onResetTimer={resetTaskTimer}
            />
          ) : activeNav === "Lộ trình" ? (
            <RoadmapView
              courses={courses}
              onBack={() => setActiveNav("Tổng quan")}
              onAddCourse={addCourseFromRoadmap}
              onUpdateDeadline={updateCourseDeadline}
              onAddLessons={addLessons}
              onToggleLesson={toggleLesson}
            />
          ) : activeNav === "Môn học" ? (
            <SubjectView
              subjects={subjects}
              onBack={() => setActiveNav("Tổng quan")}
              onToggleSubject={toggleSubjectCompletion}
              onAddSubject={addSubject}
              currentGpa={summary.currentGpa}
              targetGpa={summary.targetGpa}
              onUpdateGpa={updateGpa}
            />
          ) : activeNav === "Lịch của tôi" ? (
            <CalendarView
              events={calendarEvents}
              onEventsChange={setCalendarEvents}
              onBack={() => setActiveNav("Tổng quan")}
              guest={authStatus === "guest"}
            />
          ) : (
            <div className="mx-auto max-w-[1380px] px-5 py-8 md:px-10 md:py-10">
              <DashboardHero
                greeting={greeting}
                userName={greetingName}
                quote={dailyQuotes?.greeting}
              />

              <DailyFocusCard
                minutes={todayMinutes}
                streak={currentStreak}
                taskTitle={priorityTask?.title}
                onStart={openFocusSession}
                onAddTask={() => setShowAddTask(true)}
              />

              <div className="mt-5">
                <CompactKpiGrid
                  items={[
                    {
                      label: "Tiến độ học tập",
                      value: `${summary.learningProgressPercent}%`,
                      helper: "Trung bình các lộ trình",
                      tone: "violet",
                      icon: summaryIcons.progress,
                      progress: summary.learningProgressPercent,
                      onClick: () => setActiveNav("Lộ trình"),
                      actionLabel: "Mở tab Lộ trình",
                    },
                    {
                      label: "Việc đã hoàn thành",
                      value: `${summary.completedTasks}/${summary.totalTasks}`,
                      helper: `${remaining} việc còn lại · ${summary.totalTasks} tổng số`,
                      tone: "green",
                      icon: summaryIcons.tasks,
                      progress: summary.totalTasks
                        ? (summary.completedTasks / summary.totalTasks) * 100
                        : 0,
                      onClick: () => setActiveNav("Việc cần làm"),
                      actionLabel: "Mở tab Việc cần làm",
                    },
                    {
                      label: "GPA hiện tại",
                      value:
                        summary.currentGpa === null
                          ? "Chưa thiết lập"
                          : summary.currentGpa.toFixed(2),
                      helper:
                        summary.targetGpa === null
                          ? "Thiết lập trong tab Môn học"
                          : `Mục tiêu: ${summary.targetGpa.toFixed(2)}`,
                      tone: "amber",
                      icon: summaryIcons.gpa,
                      progress:
                        summary.currentGpa !== null && summary.targetGpa
                          ? (summary.currentGpa / summary.targetGpa) * 100
                          : 0,
                      onClick: () => setActiveNav("Môn học"),
                      actionLabel: "Mở tab Môn học",
                    },
                  ]}
                />
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <StreakCard
                  logs={focusLogs}
                  now={currentTime}
                  onOpenTasks={() => setActiveNav("Việc cần làm")}
                />
                <WeeklyInsightStrip
                  sessions={weeklySessions}
                  minutes={weeklyMinutes}
                  completedTasks={summary.completedTasks}
                  insight={weeklyInsight}
                />
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <section className="dashboard-surface dashboard-card-hover p-5 md:p-6">
                  <DashboardSectionHeader
                    title="Việc cần ưu tiên"
                    description="Những việc bạn nên xử lý sớm"
                    action={
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowAddTask(true)}
                          className="dashboard-text-action dashboard-focus flex items-center gap-1 rounded-md px-1 text-xs font-semibold"
                        >
                          <Plus className="size-3.5" /> Thêm việc
                        </button>
                        <button
                          onClick={() => setActiveNav("Việc cần làm")}
                          className="dashboard-text-action dashboard-focus flex items-center gap-1 rounded-md px-1 text-xs font-semibold"
                        >
                          Xem tất cả <ArrowUpRight className="size-3.5" />
                        </button>
                      </div>
                    }
                  />
                  {tasks.length > 0 ? (
                    <div className="space-y-2">
                      {orderedTasks.slice(0, 4).map((task, index) => (
                        <div
                          key={task.id}
                          className={
                            index === 0 && !task.done
                              ? "rounded-xl ring-1 ring-[#FCE7EF]/70 dark:ring-pink-300/15"
                              : ""
                          }
                        >
                          <TaskRow task={task} onToggle={toggleTask} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <DashboardEmptyState
                      title="Bạn đã hoàn thành mọi việc"
                      description="Tạo một task mới để giữ nhịp học tập cho hôm nay."
                      actionLabel="Thêm việc"
                      onAction={() => setShowAddTask(true)}
                      icon={<CheckCircle2 className="size-4" />}
                    />
                  )}
                  {showAddTask && (
                    <form
                      className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-white/5"
                      onSubmit={(event) => {
                        event.preventDefault()
                        addTask()
                      }}
                    >
                      <div>
                        <label className="min-w-0">
                          <span className="sr-only">Tên công việc</span>
                          <input
                            autoFocus
                            required
                            value={newTask}
                            onChange={(event) => setNewTask(event.target.value)}
                            placeholder="Bạn cần làm gì?"
                            className="dashboard-focus h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#F5A9C4]/70 focus:ring-2 focus:ring-[#F5A9C4]/20 dark:border-white/10 dark:bg-[#171921]"
                          />
                        </label>
                      </div>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <fieldset>
                          <legend className="mb-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Mức độ ưu tiên
                          </legend>
                          <div className="flex gap-1.5">
                            {(["Cao", "Vừa", "Thấp"] as const).map((priority) => (
                              <button
                                key={priority}
                                type="button"
                                aria-pressed={newTaskPriority === priority}
                                onClick={() => setNewTaskPriority(priority)}
                                className={`dashboard-focus rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${priorityStyles[priority]} ${newTaskPriority === priority ? "ring-2 ring-[#F5A9C4] ring-offset-1 dark:ring-offset-[#171921]" : "opacity-60 hover:opacity-100"}`}
                              >
                                {priority === "Cao"
                                  ? "Khẩn cấp"
                                  : priority === "Vừa"
                                    ? "Vừa"
                                    : "Thấp"}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                        <div className="flex gap-2 self-end">
                          <button
                            type="button"
                            onClick={() => setShowAddTask(false)}
                            className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-white/10"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="dashboard-primary-button dashboard-focus rounded-lg px-3 py-2 text-xs font-semibold"
                          >
                            Lưu việc
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </section>

                <section className="dashboard-surface dashboard-card-hover p-5 md:p-6">
                  <DashboardSectionHeader
                    title="Lộ trình đang theo dõi"
                    description="Tiếp tục chinh phục mục tiêu"
                    action={
                      <button
                        onClick={() => setActiveNav("Lộ trình")}
                        aria-label="Xem tất cả lộ trình"
                        className="dashboard-text-action dashboard-focus rounded-md px-1 text-xs font-semibold"
                      >
                        Xem tất cả
                      </button>
                    }
                  />
                  {showAddCourse && (
                    <form
                      className="mb-4 rounded-xl bg-slate-50 p-3 dark:bg-white/5"
                      onSubmit={(event) => {
                        event.preventDefault()
                        addCourse()
                      }}
                    >
                      <div className="space-y-2.5">
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Tên khóa học
                          </span>
                          <input
                            autoFocus
                            required
                            value={newCourse}
                            onChange={(event) => setNewCourse(event.target.value)}
                            placeholder="Ví dụ: UI/UX Design"
                            className="dashboard-focus h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#F5A9C4]/70 focus:ring-2 focus:ring-[#F5A9C4]/20 dark:border-white/10 dark:bg-[#171921]"
                          />
                        </label>
                        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_180px]">
                          <label>
                            <span className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              Mục tiêu hoặc thời hạn
                            </span>
                            <input
                              value={newCourseGoal}
                              onChange={(event) => setNewCourseGoal(event.target.value)}
                              placeholder="Ví dụ: Hoàn thành tháng 12"
                              className="dashboard-focus h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#F5A9C4]/70 focus:ring-2 focus:ring-[#F5A9C4]/20 dark:border-white/10 dark:bg-[#171921]"
                            />
                          </label>
                          <label>
                            <span className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              Ngày đích
                            </span>
                            <input
                              type="date"
                              value={newCourseDeadline}
                              onChange={(event) => setNewCourseDeadline(event.target.value)}
                              aria-label="Ngày đích"
                              className="dashboard-focus h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#F5A9C4]/70 focus:ring-2 focus:ring-[#F5A9C4]/20 dark:border-white/10 dark:bg-[#171921]"
                            />
                          </label>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddCourse(false)}
                          className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-white/10"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="dashboard-primary-button dashboard-focus rounded-lg px-3 py-2 text-xs font-semibold"
                        >
                          Thêm khóa học
                        </button>
                      </div>
                    </form>
                  )}
                  {courses.length > 0 ? (
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => setActiveNav("Lộ trình")}
                          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition hover:border-pink-200 hover:bg-pink-50/50 dark:hover:border-pink-300/20 dark:hover:bg-pink-300/5 ${course.featured ? "border-pink-200/80 bg-pink-50/40 dark:border-pink-300/20 dark:bg-pink-300/5" : "border-dashed border-slate-200 dark:border-white/10"}`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FCE7EF]/45 text-[#63465A] dark:bg-[#F5A9C4]/12 dark:text-pink-100">
                              {course.featured ? (
                                <GraduationCap className="size-4" />
                              ) : (
                                <Route className="size-4" />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">
                                {course.title}
                              </span>
                              <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                                {course.progress}% hoàn thành
                              </span>
                            </span>
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <DashboardEmptyState
                      title="Tạo lộ trình đầu tiên"
                      description="Chia mục tiêu lớn thành những bước học rõ ràng và dễ theo dõi."
                      actionLabel="Tạo lộ trình"
                      onAction={() => setActiveNav("Lộ trình")}
                      icon={<Route className="size-4" />}
                    />
                  )}
                </section>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <section className="dashboard-surface dashboard-card-hover p-5 md:p-6">
                  <DashboardSectionHeader
                    title="Tiến độ môn học"
                    description="Học kỳ 1 · Năm học 2024–2025"
                    action={
                      <button
                        onClick={() => setActiveNav("Môn học")}
                        className="dashboard-text-action dashboard-focus flex items-center gap-1 rounded-md px-1 text-xs font-semibold"
                      >
                        Quản lý môn học <ChevronRight className="size-3.5" />
                      </button>
                    }
                  />
                  <div className="space-y-5">
                    {subjects.map((subject) => (
                      <div key={subject.code}>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`size-2.5 rounded-full ${subject.color}`} />
                            <div>
                              <p className="text-sm font-medium">{subject.name}</p>
                              <p className="text-[11px] text-slate-400">
                                {subject.code} · {subject.detail}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold">{subject.progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                          <div
                            className="progress-fill progress-fill-subject h-full rounded-full"
                            style={{ width: `${subject.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="dashboard-surface dashboard-card-hover p-5 md:p-6">
                  <DashboardSectionHeader
                    title="Lịch sắp tới"
                    description="Các mốc quan trọng trong tuần"
                    action={
                      <button
                        onClick={() => setActiveNav("Lịch của tôi")}
                        aria-label="Mở lịch của tôi"
                        className="text-slate-400 transition hover:text-violet-500"
                      >
                        <CalendarDays className="size-5" />
                      </button>
                    }
                  />
                  <div className="space-y-4">
                    {calendarEvents.slice(0, 3).map((event) => (
                      <CalendarEventRow key={event.id} event={event} />
                    ))}
                    {!calendarEvents.length && (
                      <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-white/10">
                        Chưa có sự kiện sắp tới.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </section>
      </div>
      {undoTask && (
        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-white dark:text-slate-900">
          <span>Đã hoàn thành “{undoTask.task.title}”</span>
          <button
            onClick={undoCompletedTask}
            className="font-semibold text-violet-300 hover:text-violet-200 dark:text-violet-600 dark:hover:text-violet-700"
          >
            Hoàn tác
          </button>
        </div>
      )}
      {guestImportSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#63465A]/35 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-import-title"
            className="dashboard-surface w-full max-w-md p-6"
          >
            <h2
              id="guest-import-title"
              className="text-lg font-bold text-[#63465A] dark:text-[#FFF9FB]"
            >
              Lưu dữ liệu dùng thử?
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Self-Track có thể gộp các task, lộ trình, môn học, lịch và timer bạn đã tạo vào tài
              khoản này.
            </p>
            {guestImportError && (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
              >
                {guestImportError}
              </p>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={dismissGuestImport}
                className="dashboard-secondary-button dashboard-focus rounded-lg px-3 py-2 text-sm font-semibold"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                onClick={() => void importGuestData()}
                disabled={guestImporting}
                className="dashboard-primary-button dashboard-focus rounded-lg px-3 py-2 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
              >
                {guestImporting ? "Đang lưu…" : "Lưu vào tài khoản"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function TaskListView({
  tasks,
  completedTasks,
  onToggle,
  onBack,
  onAddTask,
  onRestoreTask,
  onTrashTask,
  onEditTask,
  focusTimer,
  now,
  timerQuote,
  onSetTimer,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
}: {
  tasks: Task[]
  completedTasks: Task[]
  onToggle: (id: number | string) => void
  onBack: () => void
  onAddTask: (title: string, priority: Priority) => void
  onRestoreTask: (id: number | string) => void
  onTrashTask: (id: number | string) => void
  onEditTask: (id: number | string, title: string, priority: Priority) => void
  focusTimer: PersistedFocusTimer | null
  now: number
  timerQuote?: string
  onSetTimer: (taskId: number | string | null, minutes: number) => void
  onStartTimer: (taskId: number | string | null) => void
  onPauseTimer: () => void
  onResetTimer: () => void
}) {
  const [showAddTask, setShowAddTask] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [newTask, setNewTask] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("Vừa")
  const remaining = tasks.filter((task) => !task.done).length
  const tasksByPriority = useMemo(() => groupTasksByPriority(tasks), [tasks])

  function submitTask() {
    if (!newTask.trim()) return
    onAddTask(newTask, newTaskPriority)
    setNewTask("")
    setNewTaskPriority("Vừa")
    setShowAddTask(false)
  }

  function handleToggleTask(taskId: number | string) {
    onToggle(taskId)
  }

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8 md:px-10 md:py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-violet-500">WORKSPACE</p>
          <h1 className="text-[28px] font-bold tracking-tight md:text-3xl">Việc cần làm</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {remaining} việc chưa hoàn thành · Theo dõi tiến độ mỗi ngày.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddTask((current) => !current)}
            aria-label="Thêm việc"
            aria-expanded={showAddTask}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
          >
            <Plus className="size-4" /> Thêm việc
          </button>
          <button
            onClick={onBack}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <ArrowUpRight className="size-4 rotate-[225deg]" /> Về tổng quan
          </button>
        </div>
      </div>
      <FocusTimerPanel
        focusTimer={focusTimer}
        now={now}
        quote={timerQuote}
        onSetTimer={onSetTimer}
        onStartTimer={onStartTimer}
        onPauseTimer={onPauseTimer}
        onResetTimer={onResetTimer}
      />
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171921] md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Tất cả công việc</h2>
            <p className="mt-1 text-xs text-slate-400">Nhấp vào vòng tròn để đánh dấu hoàn thành</p>
          </div>
          <CheckCircle2 className="size-5 text-violet-500" />
        </div>
        {showAddTask && (
          <form
            className="mb-4 rounded-xl bg-slate-50 p-3 dark:bg-white/5"
            onSubmit={(event) => {
              event.preventDefault()
              submitTask()
            }}
          >
            <div>
              <input
                autoFocus
                required
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
                placeholder="Bạn cần làm gì?"
                aria-label="Tên công việc"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921]"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <fieldset>
                <legend className="mb-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Mức độ ưu tiên
                </legend>
                <div className="flex gap-1.5">
                  {(["Cao", "Vừa", "Thấp"] as const).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      aria-pressed={newTaskPriority === priority}
                      onClick={() => setNewTaskPriority(priority)}
                      className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${priorityStyles[priority]} ${newTaskPriority === priority ? "ring-2 ring-violet-400 ring-offset-1 dark:ring-offset-[#171921]" : "opacity-60 hover:opacity-100"}`}
                    >
                      {priority === "Cao" ? "Khẩn cấp" : priority}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  Lưu việc
                </button>
              </div>
            </div>
          </form>
        )}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(["Cao", "Vừa", "Thấp"] as const).map((priority) => {
            const columnTasks = tasksByPriority[priority]
            return (
              <section
                key={priority}
                aria-labelledby={`task-column-${priority}`}
                className={`min-w-0 rounded-xl border p-3 ${priorityColumnStyles[priority]}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`size-2 shrink-0 rounded-full ${priority === "Cao" ? "bg-rose-400" : priority === "Vừa" ? "bg-[#D76B96]" : "bg-slate-400"}`}
                      aria-hidden="true"
                    />
                    <h3
                      id={`task-column-${priority}`}
                      className="truncate text-xs font-bold uppercase tracking-[0.12em]"
                    >
                      {priorityColumnLabels[priority]}
                    </h3>
                  </div>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnTasks.length ? (
                    columnTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={handleToggleTask}
                        onEdit={onEditTask}
                      />
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed border-current/15 px-3 py-5 text-center text-xs text-slate-400 dark:text-slate-500">
                      Không có việc {priority === "Cao" ? "khẩn cấp" : priority.toLowerCase()}
                    </p>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </section>
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171921] md:p-6">
        <button
          type="button"
          onClick={() => setShowCompleted((current) => !current)}
          aria-expanded={showCompleted}
          className="flex w-full items-center justify-between text-left"
        >
          <span>
            <span className="block font-semibold">Đã hoàn thành</span>
            <span className="mt-1 block text-xs text-slate-400">
              Xem lại các công việc đã hoàn tất
            </span>
          </span>
          <span className="flex items-center gap-3 text-xs font-semibold text-slate-400">
            {completedTasks.length} việc
            <ChevronRight
              className={`size-4 transition-transform ${showCompleted ? "rotate-90" : ""}`}
            />
          </span>
        </button>
        {showCompleted && (
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-white/8">
            {completedTasks.length ? (
              completedTasks.map((task) => (
                <CompletedTaskRow
                  key={task.id}
                  task={task}
                  onRestore={onRestoreTask}
                  onTrash={onTrashTask}
                />
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-white/10">
                Chưa có công việc đã hoàn thành.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export function FocusTimerPanel({
  focusTimer,
  now,
  quote,
  onSetTimer,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
}: {
  focusTimer: PersistedFocusTimer | null
  now: number
  quote?: string
  onSetTimer: (taskId: number | string | null, minutes: number) => void
  onStartTimer: (taskId: number | string | null) => void
  onPauseTimer: () => void
  onResetTimer: () => void
}) {
  const [timerInput, setTimerInput] = useState("25")
  const timerSeconds = focusTimer?.durationSeconds
    ? getTimerRemainingSeconds(focusTimer, now)
    : Math.max(1, Number(timerInput) || 25) * 60
  const isTimerRunning = Boolean(focusTimer?.startedAt)
  const hasConfiguredTimer = Boolean(focusTimer?.durationSeconds)
  const isTimerComplete = Boolean(
    focusTimer &&
    focusTimer.durationSeconds > 0 &&
    focusTimer.elapsedSeconds >= focusTimer.durationSeconds &&
    !focusTimer.startedAt,
  )
  const [showCelebration, setShowCelebration] = useState(false)
  const wasComplete = useRef(isTimerComplete)

  useEffect(() => {
    if (isTimerComplete && !wasComplete.current) {
      setShowCelebration(true)
      playTimerCompletionSound()
      const timeout = setTimeout(() => setShowCelebration(false), 5000)
      wasComplete.current = true
      return () => clearTimeout(timeout)
    }
    wasComplete.current = isTimerComplete
  }, [isTimerComplete])

  function setTimer(minutes: number) {
    const safeMinutes = Math.min(240, Math.max(1, minutes))
    setTimerInput(String(safeMinutes))
    onSetTimer(null, safeMinutes)
  }

  function toggleTimer() {
    if (isTimerRunning) onPauseTimer()
    else onStartTimer(null)
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm dark:border-violet-500/20 dark:from-violet-500/10 dark:to-[#171921] md:p-6">
      {showCelebration && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[2px] dark:bg-[#171921]/80"
          role="status"
          aria-live="polite"
        >
          <div className="relative flex flex-col items-center text-center">
            <span className="absolute -left-16 top-1 size-3 animate-ping rounded-full bg-[#F5A9C4]" />
            <span className="absolute -right-14 top-7 size-2 animate-ping rounded-full bg-violet-400 [animation-delay:200ms]" />
            <span className="absolute -top-4 right-0 size-2 animate-ping rounded-full bg-amber-300 [animation-delay:400ms]" />
            <Flower2 className="size-20 animate-bounce text-[#F5A9C4] drop-shadow-lg" />
            <p className="mt-2 text-lg font-bold text-[#63465A] dark:text-pink-100">
              Mục tiêu hoàn thành!
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
              <Sparkles className="size-3.5" /> Một phiên học thật tuyệt
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-300">
            <Clock3 className="size-4" />
            <p className="text-xs font-bold uppercase tracking-[0.16em]">Timer tập trung</p>
          </div>
          {quote ? (
            <p className="mt-2 line-clamp-2 max-w-md text-sm italic leading-5 text-slate-600 dark:text-slate-300">
              “{quote}”
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-center gap-3 sm:items-end">
          <span className="font-mono text-5xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">
            {formatTimer(timerSeconds)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTimer}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
              aria-label={
                isTimerRunning
                  ? "Tạm dừng timer"
                  : hasConfiguredTimer
                    ? "Tiếp tục timer"
                    : "Bắt đầu phiên học"
              }
            >
              {isTimerRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {isTimerRunning ? "Tạm dừng" : hasConfiguredTimer ? "Tiếp tục" : "Bắt đầu"}
            </button>
            <button
              type="button"
              onClick={onResetTimer}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-white dark:border-violet-500/25 dark:text-violet-300 dark:hover:bg-white/5"
              aria-label="Đặt lại timer"
            >
              <RotateCcw className="size-3.5" /> Đặt lại
            </button>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-violet-200/70 pt-4 dark:border-violet-500/15">
        <div>
          <span className="mb-1.5 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Thời lượng phiên (phút)
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="240"
              value={timerInput}
              onChange={(event) => setTimerInput(event.target.value)}
              aria-label="Số phút timer"
              className="h-9 w-20 rounded-lg border border-violet-200 bg-white px-2 text-sm outline-none focus:border-violet-500 dark:border-violet-500/20 dark:bg-[#171921]"
            />
            <button
              type="button"
              onClick={() => setTimer(Number(timerInput) || 25)}
              className="h-9 rounded-lg border border-violet-200 px-3 text-xs font-semibold text-violet-700 transition hover:bg-white dark:border-violet-500/20 dark:text-violet-300 dark:hover:bg-white/5"
            >
              Đặt
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-400">Gợi ý nhanh:</span>
        {[25, 50, 90].map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => setTimer(minutes)}
            className="rounded-full border border-violet-200 px-2.5 py-1 text-[11px] font-semibold text-violet-700 transition hover:bg-white dark:border-violet-500/20 dark:text-violet-300 dark:hover:bg-white/5"
          >
            {minutes} phút
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-400">Tối đa 240 phút</span>
      </div>
    </section>
  )
}

function RoadmapView({
  courses,
  onBack,
  onAddCourse,
  onUpdateDeadline,
  onAddLessons,
  onToggleLesson,
}: {
  courses: Course[]
  onBack: () => void
  onAddCourse: (title: string, goal: string, deadline: string | null) => void
  onUpdateDeadline: (courseId: number | string, deadline: string | null) => void
  onAddLessons: (courseId: number | string, titles: string[]) => void
  onToggleLesson: (courseId: number | string, lessonId: number | string) => void
}) {
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourse, setNewCourse] = useState("")
  const [newCourseGoal, setNewCourseGoal] = useState("")
  const [newCourseDeadline, setNewCourseDeadline] = useState("")
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, string>>({})
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({})
  const [lessonPreviews, setLessonPreviews] = useState<Record<string, string[]>>({})
  const [deadlineDrafts, setDeadlineDrafts] = useState<Record<string, string>>({})
  const [editingDeadlines, setEditingDeadlines] = useState<Set<number | string>>(() => new Set())
  const [expandedCourses, setExpandedCourses] = useState<Set<number | string>>(() => new Set())

  function submitCourse() {
    if (!newCourse.trim()) return
    onAddCourse(newCourse.trim(), newCourseGoal.trim(), newCourseDeadline || null)
    setNewCourse("")
    setNewCourseGoal("")
    setNewCourseDeadline("")
    setShowAddCourse(false)
  }

  function submitLessons(courseId: number | string) {
    const titles = lessonPreviews[courseId] ?? parseLessonList(lessonDrafts[courseId] ?? "")
    if (!titles.length) {
      setLessonErrors((current) => ({ ...current, [courseId]: "Chưa nhận diện được lesson nào." }))
      return
    }
    onAddLessons(courseId, titles)
    setLessonDrafts((current) => ({ ...current, [courseId]: "" }))
    setLessonPreviews((current) => ({ ...current, [courseId]: [] }))
    setLessonErrors((current) => ({ ...current, [courseId]: "" }))
  }

  function updateLessonDraft(courseId: number | string, value: string) {
    setLessonDrafts((current) => ({ ...current, [courseId]: value }))
    setLessonPreviews((current) => ({ ...current, [courseId]: parseLessonList(value) }))
    setLessonErrors((current) => ({ ...current, [courseId]: "" }))
  }

  async function handleLessonFile(courseId: number | string, file: File | undefined) {
    if (!file) return
    if (!/\.(txt|csv)$/i.test(file.name)) {
      setLessonErrors((current) => ({ ...current, [courseId]: "Chỉ hỗ trợ file .txt hoặc .csv." }))
      return
    }
    const content = await file.text()
    updateLessonDraft(courseId, content)
    if (!parseLessonList(content).length) {
      setLessonErrors((current) => ({ ...current, [courseId]: "File không có lesson hợp lệ." }))
    }
  }

  function toggleCourseLessons(courseId: number | string) {
    setExpandedCourses((current) => {
      const next = new Set(current)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8 md:px-10 md:py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-violet-500">WORKSPACE</p>
          <h1 className="text-[28px] font-bold tracking-tight md:text-3xl">Lộ trình</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Các khóa học và mục tiêu bạn đang theo dõi.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddCourse((current) => !current)}
            aria-label="Thêm lộ trình"
            aria-expanded={showAddCourse}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
          >
            <Plus className="size-4" /> Thêm lộ trình
          </button>
          <button
            onClick={onBack}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <ArrowUpRight className="size-4 rotate-[225deg]" /> Về tổng quan
          </button>
        </div>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171921] md:p-6">
        {showAddCourse && (
          <form
            className="mb-6 rounded-xl bg-slate-50 p-4 dark:bg-white/5"
            onSubmit={(event) => {
              event.preventDefault()
              submitCourse()
            }}
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
              <input
                autoFocus
                required
                value={newCourse}
                onChange={(event) => setNewCourse(event.target.value)}
                placeholder="Tên khóa học"
                aria-label="Tên khóa học"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921]"
              />
              <input
                value={newCourseGoal}
                onChange={(event) => setNewCourseGoal(event.target.value)}
                placeholder="Mục tiêu hoặc thời hạn"
                aria-label="Mục tiêu hoặc thời hạn"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921]"
              />
              <input
                type="date"
                value={newCourseDeadline}
                onChange={(event) => setNewCourseDeadline(event.target.value)}
                aria-label="Ngày đích"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921]"
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCourse(false)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
              >
                Thêm khóa học
              </button>
            </div>
          </form>
        )}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Lộ trình đang theo dõi</h2>
            <p className="mt-1 text-xs text-slate-400">Tiếp tục chinh phục mục tiêu</p>
          </div>
          <Route className="size-5 text-violet-500" />
        </div>
        <div className="space-y-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group rounded-xl border border-slate-200 p-4 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{course.title}</p>
                  {editingDeadlines.has(course.id) || course.deadline ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CalendarClock className="size-3.5 text-violet-500" />
                      <input
                        type="date"
                        value={deadlineDrafts[course.id] ?? course.deadline ?? ""}
                        onChange={(event) =>
                          setDeadlineDrafts((current) => ({
                            ...current,
                            [course.id]: event.target.value,
                          }))
                        }
                        aria-label={`Ngày đích cho ${course.title}`}
                        className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-600 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921] dark:text-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateDeadline(course.id, deadlineDrafts[course.id] || null)
                          setEditingDeadlines((current) => {
                            const next = new Set(current)
                            next.delete(course.id)
                            return next
                          })
                        }}
                        className="text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
                      >
                        Lưu
                      </button>
                      <span
                        className={`text-[11px] font-semibold ${getRoadmapDeadlineState(course.deadline).kind === "overdue" ? "text-rose-500" : "text-violet-600 dark:text-violet-300"}`}
                      >
                        {getRoadmapDeadlineState(course.deadline).label}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingDeadlines((current) => new Set(current).add(course.id))
                      }
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
                    >
                      <CalendarClock className="size-3.5" /> Thiết lập ngày đích
                    </button>
                  )}
                </div>
                <span className="text-sm font-bold text-violet-600 dark:text-violet-300">
                  {course.progress}%
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                <div
                  className="progress-fill progress-fill-learning h-full rounded-full"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => toggleCourseLessons(course.id)}
                aria-expanded={expandedCourses.has(course.id)}
                className="mt-4 flex w-full items-center justify-between rounded-lg border border-transparent px-2 py-2 text-left text-xs font-semibold text-violet-600 opacity-0 transition hover:border-violet-200 hover:bg-violet-50 focus-visible:opacity-100 group-hover:opacity-100 dark:text-violet-300 dark:hover:border-violet-500/20 dark:hover:bg-violet-500/10"
              >
                <span>{expandedCourses.has(course.id) ? "Ẩn bài học" : "Xem bài học"}</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {course.lessons.length} bài ·{" "}
                  {expandedCourses.has(course.id) ? "Đang mở" : "Nhấn để xem"}
                </span>
              </button>
              {expandedCourses.has(course.id) && (
                <div className="mt-2 border-t border-slate-100 pt-4 dark:border-white/8">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Mục lục bài học</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Dán hoặc upload mục lục có đánh số để tự tách lesson
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400">{course.lessons.length} bài</span>
                  </div>
                  <div className="relative space-y-2 pl-7">
                    <div className="absolute bottom-3 left-2 top-3 w-px bg-violet-500/40" />
                    {course.lessons.map((lesson, index) => (
                      <button
                        key={lesson.id}
                        onClick={() => onToggleLesson(course.id, lesson.id)}
                        className="relative flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-violet-300 dark:border-white/8 dark:bg-white/5"
                        aria-label={`${lesson.done ? "Bỏ hoàn thành" : "Hoàn thành"} bài học ${lesson.title}`}
                      >
                        <span
                          className={`absolute -left-[27px] flex size-5 items-center justify-center rounded-full border-2 bg-white text-[10px] font-bold dark:bg-[#171921] ${lesson.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-violet-500 text-violet-600 dark:text-violet-300"}`}
                        >
                          {lesson.done ? <Check className="size-3" /> : index + 1}
                        </span>
                        <span
                          className={`text-sm ${lesson.done ? "text-slate-400 line-through" : "font-medium"}`}
                        >
                          {lesson.title}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <textarea
                      value={lessonDrafts[course.id] ?? ""}
                      onChange={(event) => updateLessonDraft(course.id, event.target.value)}
                      placeholder="Ví dụ: 1. Giới thiệu\n2. Thực hành\n3. Tổng kết"
                      aria-label={`Mục lục cho ${course.title}`}
                      rows={2}
                      className="min-w-0 flex-1 resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921]"
                    />
                    <div className="flex self-end gap-2">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-violet-200 p-2 text-violet-600 hover:bg-violet-50 dark:border-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-500/10">
                        <Upload className="size-4" />
                        <span className="sr-only">Upload mục lục cho {course.title}</span>
                        <input
                          type="file"
                          accept=".txt,.csv,text/plain,text/csv"
                          className="sr-only"
                          aria-label={`Upload mục lục cho ${course.title}`}
                          onChange={(event) => {
                            void handleLessonFile(course.id, event.target.files?.[0])
                            event.currentTarget.value = ""
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => submitLessons(course.id)}
                        className="rounded-lg bg-violet-600 p-2 text-white hover:bg-violet-700"
                        aria-label={`Thêm bài học cho ${course.title}`}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                  {(lessonPreviews[course.id]?.length ?? 0) > 0 && (
                    <p className="mt-2 text-[11px] text-violet-600 dark:text-violet-300">
                      Đã nhận diện {lessonPreviews[course.id]?.length} lesson. Nhấn nút + để thêm.
                    </p>
                  )}
                  {lessonErrors[course.id] && (
                    <p className="mt-2 text-[11px] text-rose-500">{lessonErrors[course.id]}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SubjectView({
  subjects,
  onBack,
  onToggleSubject,
  onAddSubject,
  currentGpa,
  targetGpa,
  onUpdateGpa,
}: {
  subjects: Subject[]
  onBack: () => void
  onToggleSubject: (id: number | string) => void
  onAddSubject: (subject: Omit<Subject, "id" | "completed">) => void
  currentGpa: number | null
  targetGpa: number | null
  onUpdateGpa: (currentGpa: number | null, targetGpa: number | null) => void
}) {
  const [semesterFilter, setSemesterFilter] = useState("Học kỳ 1")
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newName, setNewName] = useState("")
  const [newCode, setNewCode] = useState("")
  const [newCredits, setNewCredits] = useState("3")
  const [newSemester, setNewSemester] = useState("Học kỳ 1")
  const [totalCreditsGoal, setTotalCreditsGoal] = useState(() =>
    String(subjects.reduce((total, subject) => total + subject.credits, 0)),
  )
  const [creditGoalDraft, setCreditGoalDraft] = useState(totalCreditsGoal)
  const [showCreditSettings, setShowCreditSettings] = useState(false)
  const [showGpaSettings, setShowGpaSettings] = useState(false)
  const [currentGpaDraft, setCurrentGpaDraft] = useState(currentGpa?.toString() ?? "")
  const [targetGpaDraft, setTargetGpaDraft] = useState(targetGpa?.toString() ?? "")

  const visibleSubjects =
    semesterFilter === "Tất cả khóa học"
      ? subjects
      : subjects.filter((subject) => subject.semester === semesterFilter)
  const completedCredits = subjects
    .filter((subject) => subject.completed)
    .reduce((total, subject) => total + subject.credits, 0)
  const totalCredits = Math.max(0, Number(totalCreditsGoal) || 0)
  const remainingCredits = Math.max(0, totalCredits - completedCredits)

  function submitSubject() {
    if (!newName.trim() || !newCode.trim()) return
    onAddSubject({
      name: newName.trim(),
      code: newCode.trim().toUpperCase(),
      credits: Math.max(1, Number(newCredits) || 1),
      semester: newSemester,
      progress: 0,
      color: "bg-violet-500",
      detail: "0 / 0 chương",
    })
    setNewName("")
    setNewCode("")
    setNewCredits("3")
    setNewSemester("Học kỳ 1")
    setShowAddSubject(false)
  }

  function saveCreditGoal() {
    const goal = Math.max(1, Number(creditGoalDraft) || 1)
    setTotalCreditsGoal(String(goal))
    setCreditGoalDraft(String(goal))
    setShowCreditSettings(false)
  }

  function saveGpa() {
    const parseGpa = (value: string) => {
      if (!value.trim()) return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? Math.min(4, Math.max(0, parsed)) : null
    }
    const nextCurrentGpa = parseGpa(currentGpaDraft)
    const nextTargetGpa = parseGpa(targetGpaDraft)
    onUpdateGpa(nextCurrentGpa, nextTargetGpa)
    setCurrentGpaDraft(nextCurrentGpa?.toString() ?? "")
    setTargetGpaDraft(nextTargetGpa?.toString() ?? "")
    setShowGpaSettings(false)
  }

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8 md:px-10 md:py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-violet-500">WORKSPACE</p>
          <h1 className="text-[28px] font-bold tracking-tight md:text-3xl">Môn học</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Theo dõi tiến độ các môn học trong học kỳ.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAddSubject((current) => !current)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <Plus className="size-4" /> Thêm môn học
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <ArrowUpRight className="size-4 rotate-[225deg]" /> Về tổng quan
          </button>
        </div>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171921] md:p-6">
        {showAddSubject && (
          <form
            className="mb-6 rounded-xl bg-slate-50 p-4 dark:bg-white/5"
            onSubmit={(event) => {
              event.preventDefault()
              submitSubject()
            }}
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_100px_150px]">
              <input
                autoFocus
                required
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Tên môn học"
                aria-label="Tên môn học"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921]"
              />
              <input
                required
                value={newCode}
                onChange={(event) => setNewCode(event.target.value)}
                placeholder="Mã môn"
                aria-label="Mã môn"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921]"
              />
              <input
                type="number"
                min="1"
                max="10"
                value={newCredits}
                onChange={(event) => setNewCredits(event.target.value)}
                placeholder="Tín chỉ"
                aria-label="Số tín chỉ"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921]"
              />
              <select
                value={newSemester}
                onChange={(event) => setNewSemester(event.target.value)}
                aria-label="Học kỳ của môn học"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921]"
              >
                <option>Học kỳ 1</option>
                <option>Học kỳ 2</option>
                <option>Học kỳ hè</option>
              </select>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddSubject(false)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
              >
                Lưu môn học
              </button>
            </div>
          </form>
        )}
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">Tiến độ môn học</h2>
            <p className="mt-1 text-xs text-slate-400">
              Theo dõi môn học và tín chỉ cần hoàn thành
            </p>
          </div>
          <select
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
            aria-label="Bộ lọc học kỳ"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921]"
          >
            <option>Học kỳ 1</option>
            <option>Học kỳ 2</option>
            <option>Học kỳ hè</option>
            <option>Tất cả khóa học</option>
          </select>
        </div>
        {showCreditSettings && (
          <form
            className="mb-4 flex flex-wrap items-end gap-3 rounded-xl bg-pink-50 p-4 dark:bg-pink-300/5"
            onSubmit={(event) => {
              event.preventDefault()
              saveCreditGoal()
            }}
          >
            <label className="flex-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Tổng tín chỉ cần hoàn thành
              <input
                autoFocus
                type="number"
                min="1"
                value={creditGoalDraft}
                onChange={(event) => setCreditGoalDraft(event.target.value)}
                aria-label="Tổng tín chỉ cần hoàn thành"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921] dark:text-slate-100 sm:w-48"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowCreditSettings(false)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Lưu tổng tín chỉ
            </button>
          </form>
        )}
        {showGpaSettings && (
          <form
            className="mb-4 flex flex-wrap items-end gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-300/5"
            onSubmit={(event) => {
              event.preventDefault()
              saveGpa()
            }}
          >
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              GPA hiện tại
              <input
                autoFocus
                type="number"
                min="0"
                max="4"
                step="0.01"
                value={currentGpaDraft}
                onChange={(event) => setCurrentGpaDraft(event.target.value)}
                aria-label="GPA hiện tại"
                className="mt-1 h-9 w-32 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921] dark:text-slate-100"
              />
            </label>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              GPA mục tiêu
              <input
                type="number"
                min="0"
                max="4"
                step="0.01"
                value={targetGpaDraft}
                onChange={(event) => setTargetGpaDraft(event.target.value)}
                aria-label="GPA mục tiêu"
                className="mt-1 h-9 w-32 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921] dark:text-slate-100"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowGpaSettings(false)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Lưu GPA
            </button>
          </form>
        )}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setShowCreditSettings(true)}
            aria-label="Thiết lập tổng tín chỉ"
            className="rounded-xl bg-pink-50 p-4 text-left transition hover:bg-pink-100 dark:bg-pink-300/5 dark:hover:bg-pink-300/10"
          >
            <span className="block text-xs text-slate-400">Tín chỉ tổng</span>
            <span className="mt-1 block text-lg font-bold">{totalCredits} tín chỉ</span>
            <span className="mt-2 block text-[11px] font-semibold text-violet-600 dark:text-violet-300">
              Thiết lập ban đầu
            </span>
          </button>
          <SubjectStat label="Đã tích lũy" value={`${completedCredits}/${totalCredits} tín chỉ`} />
          <SubjectStat label="Còn lại" value={`${remainingCredits} tín chỉ`} />
          <button
            type="button"
            onClick={() => setShowGpaSettings(true)}
            aria-label="Thiết lập GPA"
            className="rounded-xl bg-amber-50 p-4 text-left transition hover:bg-amber-100 dark:bg-amber-300/5 dark:hover:bg-amber-300/10"
          >
            <span className="block text-xs text-slate-400">GPA hiện tại</span>
            <span className="mt-1 block text-lg font-bold">
              {currentGpa === null ? "Chưa thiết lập" : currentGpa.toFixed(2)}
            </span>
            <span className="mt-2 block text-[11px] font-semibold text-violet-600 dark:text-violet-300">
              {targetGpa === null ? "Thiết lập GPA" : `Mục tiêu ${targetGpa.toFixed(2)}`}
            </span>
          </button>
        </div>
        <div className="space-y-3">
          {visibleSubjects.map((subject) => (
            <div
              key={subject.id}
              className={`rounded-xl border p-4 transition ${subject.completed ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5" : "border-slate-200 dark:border-white/10"}`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggleSubject(subject.id)}
                  aria-label={`${subject.completed ? "Bỏ hoàn thành" : "Đánh dấu hoàn thành"} ${subject.name}`}
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${subject.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-violet-500 dark:border-white/20"}`}
                >
                  <Check className="size-3" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p
                        className={`text-sm font-semibold ${subject.completed ? "text-slate-500 line-through dark:text-slate-400" : ""}`}
                      >
                        {subject.name}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {subject.code} · {subject.credits} tín chỉ · {subject.semester}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${subject.completed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"}`}
                    >
                      {subject.completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {visibleSubjects.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 dark:border-white/10">
              Chưa có môn học trong học kỳ này. Hãy thêm môn học để bắt đầu theo dõi.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function SubjectStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  )
}

function CalendarView({
  events,
  onEventsChange,
  onBack,
  guest,
}: {
  events: CalendarEvent[]
  onEventsChange: (events: CalendarEvent[]) => void
  onBack: () => void
  guest: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [view, setView] = useState<"all" | "week" | "month">("week")
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey(new Date()))
  const [error, setError] = useState("")
  const [googleStatus, setGoogleStatus] = useState<{
    connected: boolean
    lastSyncedAt: string | null
    syncError: string | null
    selectedCalendarIds: string[]
    keywords: string[]
    calendars: Array<{ id: string; summary?: string; primary?: boolean }>
  }>({
    connected: false,
    lastSyncedAt: null,
    syncError: null,
    selectedCalendarIds: [],
    keywords: [],
    calendars: [],
  })
  const [form, setForm] = useState(() => emptyCalendarForm())

  useEffect(() => {
    if (guest) return
    void fetch("/api/calendar/google/status")
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          data: {
            connected?: boolean
            lastSyncedAt?: string | null
            syncError?: string | null
            selectedCalendarIds?: string[]
            keywords?: string[]
          } | null,
        ) => {
          if (!data) return
          setGoogleStatus({
            connected: Boolean(data.connected),
            lastSyncedAt: data.lastSyncedAt ?? null,
            syncError: data.syncError ?? null,
            selectedCalendarIds: data.selectedCalendarIds ?? [],
            keywords: data.keywords ?? [],
            calendars: [],
          })
          if (data.connected) {
            void fetch("/api/calendar/google/calendars")
              .then((response) => (response.ok ? response.json() : null))
              .then(
                (
                  calendarData: {
                    calendars?: Array<{ id: string; summary?: string; primary?: boolean }>
                  } | null,
                ) => {
                  if (calendarData?.calendars)
                    setGoogleStatus((current) => ({
                      ...current,
                      calendars: calendarData.calendars ?? [],
                      selectedCalendarIds: current.selectedCalendarIds.length
                        ? current.selectedCalendarIds
                        : (calendarData.calendars ?? []).map((calendar) => calendar.id),
                    }))
                },
              )
              .catch(() => undefined)
          }
        },
      )
      .catch(() => undefined)
  }, [guest])

  const visibleEvents = useMemo(() => {
    const now = new Date()
    const end = new Date(now)
    if (view === "week") end.setDate(end.getDate() + 7)
    if (view === "month") end.setDate(end.getDate() + 31)
    return events.filter((event) => {
      const matchesType = filter === "all" || event.eventType === filter
      const startsAt = new Date(event.startsAt)
      return matchesType && (view === "all" || (startsAt >= now && startsAt <= end))
    })
  }, [events, filter, view])

  const weekDays = useMemo(() => {
    const now = new Date()
    return getWeekDateKeys(now).map((key, index) => {
      const date = new Date(now)
      date.setHours(12, 0, 0, 0)
      date.setDate(date.getDate() + index)
      return {
        key,
        date,
        events: events.filter(
          (event) =>
            getEventDateKey(event.startsAt) === key &&
            (filter === "all" || event.eventType === filter),
        ),
      }
    })
  }, [events, filter])

  const selectedDayEvents = useMemo(
    () => weekDays.find((day) => day.key === selectedDate)?.events ?? [],
    [selectedDate, weekDays],
  )

  function updateForm(field: keyof CalendarForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function startCreate() {
    setEditingId(null)
    setForm(emptyCalendarForm())
    setError("")
    setShowForm(true)
  }

  function startEdit(event: CalendarEvent) {
    setEditingId(event.id)
    setForm({
      title: event.title,
      startsAt: event.allDay ? event.startsAt.slice(0, 10) : toDateTimeInput(event.startsAt),
      endsAt: event.allDay ? event.endsAt.slice(0, 10) : toDateTimeInput(event.endsAt),
      allDay: event.allDay,
      location: event.location ?? "",
      description: event.description ?? "",
      eventType: event.eventType,
      reminderMinutes: String(event.reminderMinutes),
    })
    setError("")
    setShowForm(true)
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const payload = {
      ...form,
      reminderMinutes: Number(form.reminderMinutes),
    }
    if (guest) {
      if (
        !form.title.trim() ||
        !isCalendarDateRangeValid(form.startsAt, form.endsAt, form.allDay)
      ) {
        setError("Vui lòng nhập tiêu đề và khoảng thời gian hợp lệ")
        return
      }
      const startsAt = form.allDay
        ? `${form.startsAt}T00:00:00`
        : new Date(form.startsAt).toISOString()
      const endsAt = form.allDay ? `${form.endsAt}T23:59:59` : new Date(form.endsAt).toISOString()
      const localEvent: CalendarEvent = {
        id: editingId ?? `guest-event-${Date.now()}`,
        title: form.title.trim(),
        startsAt,
        endsAt,
        allDay: form.allDay,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
        eventType: form.eventType,
        reminderMinutes: Number(form.reminderMinutes),
        source: "local",
        externalId: null,
        sourceCalendarId: null,
      }
      const next = editingId
        ? events.map((item) => (item.id === editingId ? localEvent : item))
        : [...events, localEvent]
      onEventsChange(sortCalendarEvents(next))
      setShowForm(false)
      setEditingId(null)
      return
    }
    const response = await fetch(editingId ? `/api/calendar/${editingId}` : "/api/calendar", {
      method: editingId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = (await response.json()) as { event?: CalendarEvent; message?: string }
    if (!response.ok || !data.event) {
      setError(data.message ?? "Không thể lưu sự kiện")
      return
    }
    const next = editingId
      ? events.map((item) => (item.id === editingId ? data.event! : item))
      : [...events, data.event]
    onEventsChange(sortCalendarEvents(next))
    setShowForm(false)
    setEditingId(null)
  }

  async function deleteEvent(event: CalendarEvent) {
    if (event.source === "google") return
    if (guest) {
      onEventsChange(events.filter((item) => item.id !== event.id))
      return
    }
    const response = await fetch(`/api/calendar/${event.id}`, { method: "DELETE" })
    if (response.ok) onEventsChange(events.filter((item) => item.id !== event.id))
  }

  async function syncGoogleCalendar() {
    if (guest) return
    const response = await fetch("/api/calendar/google/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        selectedCalendarIds: googleStatus.selectedCalendarIds,
        keywords: googleStatus.keywords,
      }),
    })
    const data = (await response.json()) as { message?: string }
    if (!response.ok) {
      setGoogleStatus((current) => ({ ...current, syncError: data.message ?? "Không thể đồng bộ" }))
      return
    }
    const calendarResponse = await fetch("/api/calendar")
    if (calendarResponse.ok) {
      const calendarData = (await calendarResponse.json()) as { events?: CalendarEvent[] }
      onEventsChange(sortCalendarEvents(calendarData.events ?? []))
    }
    setGoogleStatus((current) => ({
      ...current,
      lastSyncedAt: new Date().toISOString(),
      syncError: null,
    }))
  }

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8 md:px-10 md:py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-violet-500">WORKSPACE</p>
          <h1 className="text-[28px] font-bold tracking-tight md:text-3xl">Lịch của tôi</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Các mốc quan trọng và lịch học sắp tới của bạn.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={guest}
            onClick={() => {
              if (!googleStatus.connected) {
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.assign("/api/calendar/google/connect")
              }
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <CalendarDays className="size-4" />
            {guest
              ? "Cần tài khoản để kết nối"
              : googleStatus.connected
                ? "Đã kết nối Google"
                : "Kết nối Google Calendar"}
          </button>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
          >
            <Plus className="size-4" /> Thêm sự kiện
          </button>
          <button
            onClick={onBack}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <ArrowUpRight className="size-4 rotate-[225deg]" /> Về tổng quan
          </button>
        </div>
      </div>
      {googleStatus.connected && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span>
            Google Calendar đang kết nối
            {googleStatus.lastSyncedAt &&
              ` · Đồng bộ lần cuối ${new Date(googleStatus.lastSyncedAt).toLocaleString("vi-VN")}`}
            {googleStatus.syncError && ` · ${googleStatus.syncError}`}
          </span>
          <div className="flex gap-3">
            <details className="relative">
              <summary className="cursor-pointer font-semibold underline">Cài đặt lọc</summary>
              <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-emerald-200 bg-white p-4 text-slate-700 shadow-xl dark:border-emerald-500/20 dark:bg-[#171921] dark:text-slate-200">
                <p className="mb-2 font-semibold">Calendar cần theo dõi</p>
                <div className="space-y-1">
                  {googleStatus.calendars.map((calendar) => (
                    <label key={calendar.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={
                          !googleStatus.selectedCalendarIds.length ||
                          googleStatus.selectedCalendarIds.includes(calendar.id)
                        }
                        onChange={(event) =>
                          setGoogleStatus((current) => ({
                            ...current,
                            selectedCalendarIds: event.target.checked
                              ? [...new Set([...current.selectedCalendarIds, calendar.id])]
                              : current.selectedCalendarIds.filter((id) => id !== calendar.id),
                          }))
                        }
                      />
                      {calendar.summary ?? calendar.id}
                    </label>
                  ))}
                </div>
                <label className="mt-3 block text-xs">
                  Từ khóa (cách nhau bằng dấu phẩy)
                  <input
                    value={googleStatus.keywords.join(", ")}
                    onChange={(event) =>
                      setGoogleStatus((current) => ({
                        ...current,
                        keywords: event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      }))
                    }
                    className="mt-1 h-8 w-full rounded-md border border-slate-200 px-2 text-xs dark:border-white/10 dark:bg-[#11131a]"
                  />
                </label>
              </div>
            </details>
            <button
              type="button"
              onClick={() => void syncGoogleCalendar()}
              className="font-semibold underline"
            >
              Đồng bộ
            </button>
            <button
              type="button"
              onClick={() => {
                void fetch("/api/calendar/google/disconnect", { method: "POST" }).then(() =>
                  setGoogleStatus({
                    connected: false,
                    lastSyncedAt: null,
                    syncError: null,
                    selectedCalendarIds: [],
                    keywords: [],
                    calendars: [],
                  }),
                )
              }}
              className="font-semibold underline"
            >
              Ngắt kết nối
            </button>
          </div>
        </div>
      )}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171921] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Lịch sắp tới</h2>
            <p className="mt-1 text-xs text-slate-400">Các mốc quan trọng trong tuần</p>
          </div>
          <CalendarDays className="size-5 text-violet-500" />
        </div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
            {(["week", "month", "all"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === item ? "bg-white text-violet-600 shadow-sm dark:bg-[#252936] dark:text-violet-300" : "text-slate-500"}`}
              >
                {item === "week" ? "7 ngày tới" : item === "month" ? "30 ngày tới" : "Tất cả"}
              </button>
            ))}
          </div>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Lọc loại sự kiện"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-[#171921]"
          >
            <option value="all">Tất cả loại</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {view === "week" ? (
          <>
            <div className="grid grid-cols-7 gap-1.5 md:gap-2" aria-label="Chọn ngày trong tuần">
              {weekDays.map((day) => {
                const isSelected = day.key === selectedDate
                const isToday = day.key === getLocalDateKey(new Date())
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDate(day.key)}
                    aria-pressed={isSelected}
                    className={`rounded-xl border px-1 py-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A9C4] md:px-2 ${isSelected ? "border-[#F5A9C4] bg-[#FCE7EF]/35 text-[#63465A] dark:border-[#F5A9C4]/70 dark:bg-[#F5A9C4]/15 dark:text-pink-100" : "border-slate-200 hover:border-[#FCE7EF] hover:bg-slate-50 dark:border-white/10 dark:hover:border-pink-300/30 dark:hover:bg-white/5"}`}
                  >
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">
                      {day.date.toLocaleDateString("vi-VN", { weekday: "short" }).replace(".", "")}
                    </span>
                    <span
                      className={`mt-1 block text-sm font-bold ${isToday ? "text-[#D76B96] dark:text-pink-200" : ""}`}
                    >
                      {day.date.getDate()}
                    </span>
                    <span
                      className="mx-auto mt-1 block h-1 w-1 rounded-full bg-[#F5A9C4]"
                      style={{ opacity: day.events.length ? 1 : 0 }}
                    />
                  </button>
                )
              })}
            </div>
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedDayEvents.length
                      ? `${selectedDayEvents.length} sự kiện`
                      : "Ngày trống để bạn tập trung"}
                  </p>
                </div>
                <span className="rounded-full bg-[#FCE7EF]/35 px-2.5 py-1 text-[10px] font-semibold text-[#63465A] dark:bg-[#F5A9C4]/15 dark:text-pink-100">
                  Tuần này
                </span>
              </div>
              <div className="space-y-3">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="relative border-l-2 border-[#FCE7EF] pl-4 dark:border-[#F5A9C4]/40"
                  >
                    <span className="absolute -left-[5px] top-5 size-2 rounded-full bg-[#F5A9C4] ring-4 ring-white dark:ring-[#171921]" />
                    <CalendarEventRow
                      event={event}
                      onEdit={event.source === "local" ? () => startEdit(event) : undefined}
                      onDelete={
                        event.source === "local" ? () => void deleteEvent(event) : undefined
                      }
                    />
                  </div>
                ))}
                {!selectedDayEvents.length && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-7 text-center dark:border-white/10">
                    <CalendarDays className="mx-auto size-7 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm font-semibold">Chưa có sự kiện trong ngày này</p>
                    <button
                      type="button"
                      onClick={startCreate}
                      className="mt-2 text-xs font-semibold text-[#D76B96] hover:underline dark:text-pink-200"
                    >
                      + Thêm sự kiện
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-5">
            {visibleEvents.map((event) => (
              <CalendarEventRow
                key={event.id}
                event={event}
                onEdit={event.source === "local" ? () => startEdit(event) : undefined}
                onDelete={event.source === "local" ? () => void deleteEvent(event) : undefined}
              />
            ))}
            {!visibleEvents.length && (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-white/10">
                <CalendarDays className="mx-auto size-8 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-semibold">Chưa có sự kiện phù hợp</p>
                <p className="mt-1 text-xs text-slate-400">
                  Thêm sự kiện đầu tiên để theo dõi lịch học và deadline.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
      {showForm && (
        <CalendarEventForm
          form={form}
          editing={Boolean(editingId)}
          error={error}
          onChange={updateForm}
          onSubmit={saveEvent}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

type CalendarForm = {
  title: string
  startsAt: string
  endsAt: string
  allDay: boolean
  location: string
  description: string
  eventType: CalendarEvent["eventType"]
  reminderMinutes: string
}

function toDateTimeInput(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (number: number) => String(number).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function emptyCalendarForm(): CalendarForm {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start)
  end.setHours(end.getHours() + 1)
  return {
    title: "",
    startsAt: toDateTimeInput(start.toISOString()),
    endsAt: toDateTimeInput(end.toISOString()),
    allDay: false,
    location: "",
    description: "",
    eventType: "personal",
    reminderMinutes: "30",
  }
}

function CalendarEventRow({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent
  onEdit?: () => void
  onDelete?: () => void
}) {
  const colors = {
    exam: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
    deadline: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    event: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
    study: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    personal: "bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-300",
  }
  const startsAt = new Date(event.startsAt)
  const day = startsAt.toLocaleDateString("vi-VN", { day: "2-digit" })
  const month = startsAt.toLocaleDateString("vi-VN", { month: "short" }).toUpperCase()
  const time = event.allDay
    ? "Cả ngày"
    : startsAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  return (
    <div className="group flex items-center gap-3">
      <div
        className={`flex h-11 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${colors[event.eventType]}`}
      >
        <span className="text-base font-bold leading-4">{day}</span>
        <span className="text-[8px] font-bold">{month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{event.title}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
          <Clock3 className="size-3" /> {EVENT_TYPE_LABELS[event.eventType]} · {time}
          {event.source === "google" ? " · Google Calendar" : " · Self-Track"}
        </p>
        {(event.location || event.description) && (
          <p className="mt-1 truncate text-[11px] text-slate-400">
            {event.location ?? event.description}
          </p>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-violet-600 hover:bg-violet-50 dark:text-violet-300"
            >
              Sửa
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300"
            >
              Xoá
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function CalendarEventForm({
  form,
  editing,
  error,
  onChange,
  onSubmit,
  onClose,
}: {
  form: CalendarForm
  editing: boolean
  error: string
  onChange: (field: keyof CalendarForm, value: string | boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/35 p-4 sm:items-center">
      <form
        onSubmit={onSubmit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#171921]"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{editing ? "Sửa sự kiện" : "Thêm sự kiện"}</h2>
            <p className="mt-1 text-xs text-slate-400">Điền thông tin giống Google Calendar.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng form sự kiện"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            required
            value={form.title}
            onChange={(event) => onChange("title", event.target.value)}
            placeholder="Tên sự kiện"
            aria-label="Tên sự kiện"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#171921]"
          />
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(event) => onChange("allDay", event.target.checked)}
            />{" "}
            Sự kiện cả ngày
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-500 dark:text-slate-400">
              Bắt đầu
              <input
                required
                type={form.allDay ? "date" : "datetime-local"}
                value={form.startsAt}
                onChange={(event) => onChange("startsAt", event.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-white/10 dark:bg-[#171921]"
              />
            </label>
            <label className="text-xs text-slate-500 dark:text-slate-400">
              Kết thúc
              <input
                required
                type={form.allDay ? "date" : "datetime-local"}
                value={form.endsAt}
                onChange={(event) => onChange("endsAt", event.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-white/10 dark:bg-[#171921]"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={form.eventType}
              onChange={(event) => onChange("eventType", event.target.value)}
              aria-label="Loại sự kiện"
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-white/10 dark:bg-[#171921]"
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={form.reminderMinutes}
              onChange={(event) => onChange("reminderMinutes", event.target.value)}
              aria-label="Nhắc nhở"
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-white/10 dark:bg-[#171921]"
            >
              <option value="0">Không nhắc</option>
              <option value="10">10 phút trước</option>
              <option value="30">30 phút trước</option>
              <option value="60">1 giờ trước</option>
              <option value="1440">1 ngày trước</option>
            </select>
          </div>
          <input
            value={form.location}
            onChange={(event) => onChange("location", event.target.value)}
            placeholder="Địa điểm hoặc liên kết"
            aria-label="Địa điểm"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-[#171921]"
          />
          <textarea
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder="Mô tả"
            aria-label="Mô tả"
            rows={3}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-[#171921]"
          />
        </div>
        {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            Huỷ
          </button>
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
          >
            {editing ? "Lưu thay đổi" : "Thêm sự kiện"}
          </button>
        </div>
      </form>
    </div>
  )
}

function StreakCard({
  logs,
  now,
  onOpenTasks,
  compact = false,
}: {
  logs: DailyFocusLog[]
  now: Date | null
  onOpenTasks: () => void
  compact?: boolean
}) {
  const anchor = now ?? new Date(2000, 0, 3)
  const weekDays = getWeekDays(logs, anchor)
  const completedDays = weekDays.filter((day) => day.completed).length
  const streak = calculateCurrentStreak(logs, anchor)
  const todaySeconds = getTodayFocusSeconds(logs, anchor)
  const todayMinutes = Math.floor(todaySeconds / 60)
  const remainingMinutes = Math.max(0, Math.ceil((DAILY_FOCUS_GOAL_SECONDS - todaySeconds) / 60))
  const radius = compact ? 28 : 34
  const circumference = 2 * Math.PI * radius
  const progress = completedDays / 7

  return (
    <button
      type="button"
      onClick={onOpenTasks}
      aria-label="Mở timer học tập"
      className={`group w-full text-left transition hover:border-pink-300 dark:hover:border-pink-300/30 ${compact ? "rounded-xl border border-transparent p-0" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171921]"}`}
    >
      <div className={`flex items-center gap-4 ${compact ? "" : "justify-between"}`}>
        <div className="relative shrink-0">
          <svg
            className={compact ? "size-[72px]" : "size-[88px]"}
            viewBox="0 0 80 80"
            role="img"
            aria-label={`${completedDays} trên 7 ngày đã đạt streak`}
          >
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              className="text-pink-100 dark:text-pink-300/10"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
              className="text-[#F5A9C4]"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold leading-none">{completedDays}/7</span>
            <span className="mt-1 text-[9px] text-slate-400">tuần</span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Streak học tập</p>
            <StreakFlower streak={streak} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {streak > 0 ? `Streak hiện tại: ${streak} ngày` : "Bắt đầu lại hôm nay"}
          </p>
          <p className="mt-2 text-[11px] font-medium text-slate-400">
            {todaySeconds >= DAILY_FOCUS_GOAL_SECONDS
              ? "Hôm nay đã giữ streak"
              : todaySeconds > 0
                ? `Đã học ${todayMinutes} phút · Còn ${remainingMinutes} phút`
                : "Bắt đầu phiên học để giữ streak"}
          </p>
        </div>
      </div>
      <div className={`mt-4 grid grid-cols-7 gap-1.5 ${compact ? "" : "mt-5"}`}>
        {weekDays.map((day) => (
          <span
            key={day.date}
            className="flex flex-col items-center gap-1"
            title={`${day.label} ${day.day}`}
          >
            <span className="text-[9px] text-slate-400">{day.label}</span>
            <span
              className={`flex size-5 items-center justify-center rounded-full text-[9px] font-semibold ${day.completed ? "bg-[#F5A9C4] text-[#6f1d37]" : day.date === formatDateKey(anchor) ? "border border-[#F5A9C4] text-[#a64f73] dark:text-[#F5A9C4]" : "bg-slate-100 text-slate-400 dark:bg-white/8"}`}
            >
              {day.day}
            </span>
          </span>
        ))}
      </div>
    </button>
  )
}

function CompletedTaskRow({
  task,
  onRestore,
  onTrash,
}: {
  task: Task
  onRestore: (id: number | string) => void
  onTrash: (id: number | string) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-transparent bg-slate-50 px-3 py-3 dark:bg-white/[0.03]">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="size-3" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-500 line-through dark:text-slate-400">
          {task.title}
        </p>
        <p className="mt-1 truncate text-[11px] text-slate-400">{task.subject} · Hoàn thành</p>
      </div>
      <button
        type="button"
        onClick={() => onRestore(task.id)}
        aria-label={`Khôi phục ${task.title}`}
        className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-violet-600 transition hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
      >
        Khôi phục
      </button>
      <button
        type="button"
        onClick={() => onTrash(task.id)}
        aria-label={`Đưa vào thùng rác ${task.title}`}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
        title="Đưa vào thùng rác"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}

export function TaskRow({
  task,
  onToggle,
  onEdit,
}: {
  task: Task
  onToggle: (id: number | string) => void
  onEdit?: (id: number | string, title: string, priority: Priority) => void
}) {
  const [celebrating, setCelebrating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editPriority, setEditPriority] = useState<Priority>(task.priority)
  const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (completionTimeout.current) clearTimeout(completionTimeout.current)
    },
    [],
  )

  function celebrateCompletion() {
    setCelebrating(true)
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    completionTimeout.current = setTimeout(() => onToggle(task.id), reducedMotion ? 160 : 700)
  }

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = editTitle.trim()
    if (!cleanTitle || !onEdit) return
    onEdit(task.id, cleanTitle, editPriority)
    setEditing(false)
  }

  if (editing && onEdit) {
    return (
      <form
        onSubmit={saveEdit}
        className="rounded-xl border border-[#F5A9C4]/70 bg-white/80 p-3 shadow-sm dark:border-[#F5A9C4]/25 dark:bg-white/[0.06]"
      >
        <label className="sr-only" htmlFor={`edit-task-${task.id}`}>
          Tên công việc
        </label>
        <input
          id={`edit-task-${task.id}`}
          autoFocus
          required
          value={editTitle}
          onChange={(event) => setEditTitle(event.target.value)}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#D76B96] dark:border-white/10 dark:bg-[#171921]"
        />
        <fieldset className="mt-3">
          <legend className="mb-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Di chuyển đến mức độ
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {(["Cao", "Vừa", "Thấp"] as const).map((priority) => (
              <button
                key={priority}
                type="button"
                aria-pressed={editPriority === priority}
                onClick={() => setEditPriority(priority)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${priorityStyles[priority]} ${editPriority === priority ? "ring-2 ring-[#F5A9C4] ring-offset-1 dark:ring-offset-[#171921]" : "opacity-60 hover:opacity-100"}`}
              >
                {priority === "Cao" ? "Khẩn cấp" : priority}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#F5A9C4] px-3 py-1.5 text-xs font-semibold text-[#63465A] transition hover:bg-[#D76B96] hover:text-white"
          >
            Lưu thay đổi
          </button>
        </div>
      </form>
    )
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border border-transparent px-2 py-3 transition hover:border-slate-100 hover:bg-slate-50 dark:hover:border-white/5 dark:hover:bg-white/5 ${task.done ? "opacity-55" : ""}`}
    >
      <button
        onClick={() => (task.done ? onToggle(task.id) : celebrateCompletion())}
        disabled={celebrating}
        className={`relative flex size-[18px] shrink-0 items-center justify-center rounded-full border ${task.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-violet-500 dark:border-slate-600"} disabled:cursor-wait`}
        aria-label={
          celebrating
            ? `Đang hoàn thành ${task.title}`
            : task.done
              ? `Bỏ hoàn thành ${task.title}`
              : `Hoàn thành ${task.title}`
        }
        aria-busy={celebrating}
      >
        {task.done ? (
          <Check className="size-3" />
        ) : celebrating ? (
          <span className="task-flower-burst" aria-hidden="true">
            <Flower2 className="task-flower-icon" />
            <span className="task-flower-spark task-flower-spark-one" />
            <span className="task-flower-spark task-flower-spark-two" />
            <span className="task-flower-spark task-flower-spark-three" />
            <span className="task-flower-spark task-flower-spark-four" />
          </span>
        ) : (
          <Circle className="size-2.5 fill-current" />
        )}
      </button>
      {celebrating && (
        <span className="sr-only" role="status">
          Hoàn thành!
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${task.done ? "line-through" : ""}`}>
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
          <span>{task.subject}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock3 className="size-3" />
            {task.due}
          </span>
        </div>
      </div>
      <span
        className={`hidden rounded-md px-2 py-1 text-[10px] font-semibold sm:block ${priorityStyles[task.priority]}`}
      >
        {task.priority}
      </span>
      {onEdit && !task.done ? (
        <button
          type="button"
          onClick={() => {
            setEditTitle(task.title)
            setEditPriority(task.priority)
            setEditing(true)
          }}
          aria-label={`Chỉnh sửa ${task.title}`}
          title="Chỉnh sửa và di chuyển công việc"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-[#FCE7EF] hover:text-[#7D2945] dark:hover:bg-[#F5A9C4]/10 dark:hover:text-[#F5A9C4]"
        >
          <Pencil className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
}

function getGreeting(date: Date) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return "sáng"
  if (hour >= 12 && hour < 18) return "chiều"
  return "tối"
}

function formatLiveDate(date: Date) {
  const datePart = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)
  const timePart = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
  return `${datePart} · ${timePart}`
}

function formatDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}
