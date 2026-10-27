import type { ReactNode } from "react"
import {
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react"

export function DashboardHero({
  greeting,
  userName,
  quote,
}: {
  greeting: string
  userName: string
  quote?: string
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-pink-200/70 bg-white p-5 shadow-sm dark:border-pink-300/15 dark:bg-[#171921] md:p-7">
      <div className="pointer-events-none absolute -right-14 -top-20 size-48 rounded-full bg-[#F9A8BB]/15 blur-3xl dark:bg-[#F9A8BB]/10" />
      <div className="relative">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9b3f64] dark:text-pink-200">
          HÔM NAY CỦA BẠN
        </p>
        <h1 className="text-[28px] font-bold tracking-tight md:text-3xl">
          Chào buổi {greeting}, {userName} <span aria-hidden>👋</span>
        </h1>
        {quote ? <DailyQuote quote={quote} /> : null}
      </div>
    </section>
  )
}

export function DailyQuote({ quote }: { quote: string }) {
  return (
    <div className="mt-2 flex max-w-xl items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <p className="truncate leading-5">“{quote}”</p>
    </div>
  )
}

export function DailyFocusCard({
  minutes,
  streak,
  taskTitle,
  onStart,
  onAddTask,
}: {
  minutes: number
  streak: number
  taskTitle?: string
  onStart: () => void
  onAddTask?: () => void
}) {
  const hasTask = Boolean(taskTitle)

  return (
    <section className="mt-5 flex flex-col gap-5 rounded-2xl border border-pink-200/80 bg-gradient-to-br from-pink-50 via-white to-white p-5 shadow-sm shadow-pink-100/60 dark:border-pink-300/20 dark:from-pink-300/10 dark:via-[#171921] dark:to-[#171921] md:p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F9A8BB]/25 text-[#7D2945] dark:text-pink-100">
          <Clock3 className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm font-bold">Daily focus</p>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {minutes} phút hôm nay
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              · Streak {streak} ngày
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {taskTitle
              ? `Đang ưu tiên: ${taskTitle}`
              : "Chưa có task ưu tiên · bắt đầu từ một việc nhỏ"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={hasTask ? onStart : (onAddTask ?? onStart)}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#F9A8BB] px-3 py-2 text-xs font-bold text-[#6F1D37] transition hover:bg-[#f59ab0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9A8BB] dark:text-[#421426]"
      >
        {hasTask ? "Bắt đầu phiên học" : "Thêm việc đầu tiên"} <ArrowUpRight className="size-3.5" />
      </button>
    </section>
  )
}

export function DashboardSectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function DashboardEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  icon?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-pink-200 bg-pink-50/40 p-5 text-center dark:border-pink-300/15 dark:bg-pink-300/5">
      <div className="mx-auto flex size-9 items-center justify-center rounded-xl bg-[#F9A8BB]/20 text-[#9b3f64] dark:text-pink-200">
        {icon ?? <Sparkles className="size-4" />}
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-4 rounded-lg bg-[#F9A8BB] px-3 py-2 text-xs font-bold text-[#6F1D37] transition hover:bg-[#f59ab0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9A8BB] dark:text-[#421426]"
      >
        {actionLabel}
      </button>
    </div>
  )
}

export function StatCard({
  label,
  value,
  helper,
  tone,
  icon,
  progress,
  onClick,
  actionLabel,
}: {
  label: string
  value: string
  helper: string
  tone: "violet" | "green" | "amber"
  icon: ReactNode
  progress?: number
  onClick: () => void
  actionLabel: string
}) {
  const tones = {
    violet: {
      icon: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
      bar: "bg-violet-400",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
      bar: "bg-emerald-400",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
      bar: "bg-amber-400",
    },
  }
  const toneStyle = tones[tone]
  const clampedProgress = Math.min(100, Math.max(0, progress ?? 0))

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={actionLabel}
      className="group min-h-[122px] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md dark:border-white/8 dark:bg-[#171921] dark:hover:border-pink-300/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${toneStyle.icon}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
          <div
            className={`h-full rounded-full ${toneStyle.bar}`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-slate-400">
          {Math.round(clampedProgress)}%
        </span>
      </div>
      <p className="mt-2 truncate text-[11px] text-slate-400">{helper}</p>
    </button>
  )
}

export type CompactKpiItem = {
  label: string
  value: string
  helper: string
  tone: "violet" | "green" | "amber"
  icon: ReactNode
  progress?: number
  onClick: () => void
  actionLabel: string
}

export function CompactKpiGrid({ items }: { items: CompactKpiItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  )
}

export function WeeklyInsightStrip({
  sessions,
  minutes,
  completedTasks,
  insight,
}: {
  sessions: number
  minutes: number
  completedTasks: number
  insight: string
}) {
  const metrics = [
    { label: "Phiên học", value: sessions, icon: <Clock3 className="size-4" /> },
    { label: "Phút tập trung", value: minutes, icon: <Flame className="size-4" /> },
    { label: "Task hoàn thành", value: completedTasks, icon: <ListChecks className="size-4" /> },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-[#171921] md:p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[#F9A8BB]" />
        <h2 className="text-sm font-semibold">Tuần này của bạn</h2>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex items-center gap-1.5 text-slate-400">
              {metric.icon}
              <span className="text-[10px]">{metric.label}</span>
            </div>
            <p className="mt-1 text-xl font-bold tracking-tight">{metric.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500 dark:border-white/8 dark:text-slate-400">
        <BookOpenCheck className="mt-0.5 size-3.5 shrink-0 text-[#F9A8BB]" />
        {insight}
      </p>
    </section>
  )
}

export const summaryIcons = {
  progress: <Target className="size-5" />,
  tasks: <CheckCircle2 className="size-5" />,
  gpa: <GraduationCap className="size-5" />,
}
