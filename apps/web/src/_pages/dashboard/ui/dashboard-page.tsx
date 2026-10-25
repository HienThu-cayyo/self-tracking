"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Route,
  Search,
  Target,
  X,
} from "lucide-react"

type Task = {
  id: number
  title: string
  subject: string
  due: string
  priority: "Cao" | "Vừa" | "Thấp"
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

const subjects = [
  {
    name: "Cấu trúc dữ liệu",
    code: "CS201",
    progress: 72,
    color: "bg-violet-500",
    detail: "3 / 4 chương",
  },
  {
    name: "Lập trình Web",
    code: "CS302",
    progress: 58,
    color: "bg-sky-500",
    detail: "5 / 8 chủ đề",
  },
  {
    name: "Hệ điều hành",
    code: "CS204",
    progress: 41,
    color: "bg-amber-400",
    detail: "2 / 5 chương",
  },
]

const priorityStyles = {
  Cao: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
  Vừa: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  Thấp: "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400",
}

export function DashboardPage() {
  const [activeNav, setActiveNav] = useState("Tổng quan")
  const [tasks, setTasks] = useState(initialTasks)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState("")
  const [showMobileNav, setShowMobileNav] = useState(false)

  const remaining = useMemo(() => tasks.filter((task) => !task.done).length, [tasks])

  function toggleTask(id: number) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    )
  }

  function addTask() {
    if (!newTask.trim()) return
    setTasks((current) => [
      {
        id: Date.now(),
        title: newTask.trim(),
        subject: "Cá nhân",
        due: "Chưa đặt deadline",
        priority: "Vừa",
        done: false,
      },
      ...current,
    ])
    setNewTask("")
    setShowAddTask(false)
  }

  return (
    <main className="min-h-dvh bg-[#f7f8fc] text-slate-900 dark:bg-[#11131a] dark:text-slate-100">
      <div className="flex min-h-dvh">
        <aside
          className={`${showMobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} fixed inset-y-0 left-0 z-30 flex w-[252px] flex-col border-r border-slate-200 bg-white px-5 py-6 transition-transform dark:border-white/8 dark:bg-[#171921]`}
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                <Target className="size-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                self<span className="text-violet-500">.</span>track
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
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${activeNav === label ? "bg-violet-50 text-violet-700 dark:bg-violet-500/12 dark:text-violet-300" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"}`}
              >
                <Icon className="size-[18px]" />
                {label}
                {label === "Việc cần làm" && (
                  <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                    {remaining}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-violet-50 p-4 dark:bg-violet-500/10">
            <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
              <Flame className="size-4" />
            </div>
            <p className="text-sm font-semibold">7 ngày liên tục!</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Giữ nhịp học tập của bạn mỗi ngày.
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-violet-200 dark:bg-violet-500/20">
              <div className="h-full w-[70%] rounded-full bg-violet-500" />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5 dark:border-white/8">
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-rose-400 text-xs font-bold text-white">
              MN
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Minh Nguyễn</p>
              <p className="text-xs text-slate-400">Sinh viên</p>
            </div>
            <MoreHorizontal className="ml-auto size-4 text-slate-400" />
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
          <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/80 px-5 backdrop-blur md:px-10 dark:border-white/8 dark:bg-[#11131a]/80">
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
                  className="h-9 w-56 rounded-lg border-0 bg-slate-100 pl-9 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 dark:bg-white/5 dark:focus:ring-violet-500/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="relative text-slate-400 hover:text-slate-700 dark:hover:text-white"
                aria-label="Thông báo"
              >
                <Bell className="size-[19px]" />
                <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-rose-500" />
              </button>
              <div className="hidden h-5 w-px bg-slate-200 sm:block dark:bg-white/10" />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Thứ Hai, 21 tháng 10
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-[1380px] px-5 py-8 md:px-10 md:py-10">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-sm font-medium text-violet-500">TỔNG QUAN CỦA BẠN</p>
                <h1 className="text-[28px] font-bold tracking-tight md:text-3xl">
                  Chào buổi sáng, Minh <span aria-hidden>👋</span>
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Hôm nay là một ngày tốt để tiến thêm một bước.
                </p>
              </div>
              <button
                onClick={() => setShowAddTask(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
              >
                <Plus className="size-4" /> Thêm việc mới
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Tiến độ học tập"
                value="68%"
                helper="+12% so với tuần trước"
                tone="violet"
                icon={<Target className="size-5" />}
              />
              <StatCard
                label="Việc đã hoàn thành"
                value="24"
                helper="trong tổng số 31 việc"
                tone="green"
                icon={<CheckCircle2 className="size-5" />}
              />
              <StatCard
                label="GPA hiện tại"
                value="3.42"
                helper="Mục tiêu học kỳ: 3.60"
                tone="amber"
                icon={<GraduationCap className="size-5" />}
              />
              <StatCard
                label="Chuỗi ngày học"
                value="7 ngày"
                helper="Kỷ lục của bạn: 14 ngày"
                tone="rose"
                icon={<Flame className="size-5" />}
              />
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171921] md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Việc cần ưu tiên</h2>
                    <p className="mt-1 text-xs text-slate-400">Những việc bạn nên xử lý sớm</p>
                  </div>
                  <button
                    onClick={() => setActiveNav("Việc cần làm")}
                    className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
                  >
                    Xem tất cả <ArrowUpRight className="size-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {tasks.slice(0, 4).map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={toggleTask} />
                  ))}
                </div>
                {showAddTask && (
                  <div className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-2 dark:bg-white/5">
                    <input
                      autoFocus
                      value={newTask}
                      onChange={(event) => setNewTask(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && addTask()}
                      placeholder="Bạn cần làm gì?"
                      className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                    />
                    <button
                      onClick={addTask}
                      className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Lưu
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171921] md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Lộ trình đang theo dõi</h2>
                    <p className="mt-1 text-xs text-slate-400">Tiếp tục chinh phục mục tiêu</p>
                  </div>
                  <button
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    aria-label="Thêm lộ trình"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-5 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-white/15">
                      <span className="text-xl font-bold">A</span>
                    </div>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold">
                      ĐANG HỌC
                    </span>
                  </div>
                  <p className="mt-5 text-lg font-bold">IELTS 7.0</p>
                  <p className="mt-1 text-xs text-indigo-100">Mục tiêu trước tháng 12, 2024</p>
                  <div className="mt-5 flex items-center justify-between text-xs">
                    <span>Tiến độ tổng thể</span>
                    <span className="font-bold">46%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/20">
                    <div className="h-full w-[46%] rounded-full bg-white" />
                  </div>
                  <button className="mt-5 flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white">
                    Xem lộ trình <ChevronRight className="size-3.5" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-slate-200 px-4 py-3 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <Route className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Frontend Developer</p>
                      <p className="text-[11px] text-slate-400">12% hoàn thành</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-slate-400" />
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171921] md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Tiến độ môn học</h2>
                    <p className="mt-1 text-xs text-slate-400">Học kỳ 1 · Năm học 2024–2025</p>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-300">
                    Quản lý môn học <ChevronRight className="size-3.5" />
                  </button>
                </div>
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
                          className={`h-full rounded-full ${subject.color}`}
                          style={{ width: `${subject.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171921] md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Lịch sắp tới</h2>
                    <p className="mt-1 text-xs text-slate-400">Các mốc quan trọng trong tuần</p>
                  </div>
                  <CalendarDays className="size-5 text-slate-400" />
                </div>
                <div className="space-y-4">
                  <Event
                    day="22"
                    month="THÁNG 10"
                    title="Nộp bài tập lớn tuần 5"
                    meta="Lập trình Web · 23:59"
                    color="violet"
                  />
                  <Event
                    day="24"
                    month="THÁNG 10"
                    title="Kiểm tra giữa kỳ"
                    meta="Cấu trúc dữ liệu · 08:00"
                    color="rose"
                  />
                  <Event
                    day="26"
                    month="THÁNG 10"
                    title="Buổi học IELTS"
                    meta="Speaking · 19:30"
                    color="sky"
                  />
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  helper,
  tone,
  icon,
}: {
  label: string
  value: string
  helper: string
  tone: "violet" | "green" | "amber" | "rose"
  icon: ReactNode
}) {
  const tones = {
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#171921]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">{helper}</p>
    </div>
  )
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: number) => void }) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border border-transparent px-2 py-3 transition hover:border-slate-100 hover:bg-slate-50 dark:hover:border-white/5 dark:hover:bg-white/5 ${task.done ? "opacity-55" : ""}`}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border ${task.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-violet-500 dark:border-slate-600"}`}
        aria-label={task.done ? `Bỏ hoàn thành ${task.title}` : `Hoàn thành ${task.title}`}
      >
        {task.done ? <Check className="size-3" /> : <Circle className="size-2.5 fill-current" />}
      </button>
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
    </div>
  )
}

function Event({
  day,
  month,
  title,
  meta,
  color,
}: {
  day: string
  month: string
  title: string
  meta: string
  color: "violet" | "rose" | "sky"
}) {
  const styles = {
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
  }
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-11 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${styles[color]}`}
      >
        <span className="text-base font-bold leading-4">{day}</span>
        <span className="text-[8px] font-bold">{month}</span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
          <Clock3 className="size-3" />
          {meta}
        </p>
      </div>
    </div>
  )
}
