import type { ReactNode } from "react"
import { getStreakFlowerStage } from "../model/streak"
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
    <section className="dashboard-surface dashboard-card-hover relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute -right-14 -top-20 size-48 rounded-full bg-[#F5A9C4]/15 blur-3xl dark:bg-[#F5A9C4]/10" />
      <div className="relative">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#63465A] dark:text-pink-200">
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

export function StreakFlower({ streak }: { streak: number }) {
  const stage = getStreakFlowerStage(streak)
  const petalsSpread = {
    resting: 3,
    bud: 4.5,
    opening: 6.2,
    bloom: 7.5,
    full: 7.5,
  }[stage]
  const petalSize = {
    resting: 1.8,
    bud: 2.1,
    opening: 2.3,
    bloom: 2.5,
    full: 2.6,
  }[stage]

  return (
    <svg
      className="streak-flower size-6"
      data-stage={stage}
      viewBox="0 0 32 36"
      role="img"
      aria-label={`Hoa streak: ${Math.max(0, streak)} ngày liên tục`}
    >
      {stage === "full" && <circle className="streak-flower-halo" cx="16" cy="14" r="13" />}
      <path className="streak-flower-stem" d="M16 15c-2 5 1 9-.5 16" />
      <ellipse
        className="streak-flower-leaf"
        cx="11"
        cy="25"
        rx="4"
        ry="2"
        transform="rotate(-35 11 25)"
      />
      <ellipse
        className="streak-flower-leaf"
        cx="20"
        cy="27"
        rx="4"
        ry="2"
        transform="rotate(28 20 27)"
      />
      {stage === "resting" ? (
        <path
          className="streak-flower-bud"
          d="M16 4.5c-5 4.5-4.1 10.7 0 12.2 4.1-1.5 5-7.7 0-12.2Z"
        />
      ) : (
        <>
          {Array.from({ length: 5 }, (_, index) => (
            <g key={index} transform={`rotate(${index * 72} 16 14)`}>
              <ellipse
                className="streak-flower-petal"
                cx="16"
                cy={14 - petalsSpread}
                rx={petalSize}
                ry={petalSize * 1.45}
              />
            </g>
          ))}
          <circle className="streak-flower-center" cx="16" cy="14" r="1.7" />
        </>
      )}
      {stage === "full" && (
        <g className="streak-flower-sparkles" aria-hidden="true">
          <path d="M4 8v4m-2-2h4M27 5v4m-2-2h4" />
        </g>
      )}
    </svg>
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
    <section className="dashboard-surface-subtle dashboard-card-hover mt-5 flex flex-col gap-5 p-5 md:p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5A9C4]/25 text-[#63465A] dark:text-pink-100">
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
        className="dashboard-primary-button dashboard-focus inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"
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
    <div className="dashboard-surface-subtle p-5 text-center">
      <div className="mx-auto flex size-9 items-center justify-center rounded-xl bg-[#F5A9C4]/20 text-[#a64f73] dark:text-pink-200">
        {icon ?? <Sparkles className="size-4" />}
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="dashboard-primary-button dashboard-focus mt-4 rounded-lg px-3 py-2 text-xs font-bold"
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
      icon: "bg-[#FCE7EF]/45 text-[#63465A] dark:bg-[#F5A9C4]/12 dark:text-pink-100",
      bar: "progress-fill-learning",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
      bar: "progress-fill-tasks",
    },
    amber: {
      icon: "bg-[#FCE7EF]/45 text-[#63465A] dark:bg-[#F5A9C4]/12 dark:text-pink-100",
      bar: "progress-fill-gpa",
    },
  }
  const toneStyle = tones[tone]
  const clampedProgress = Math.min(100, Math.max(0, progress ?? 0))

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={actionLabel}
      className="dashboard-surface dashboard-card-hover dashboard-focus group min-h-[122px] p-4 text-left"
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
            className={`progress-fill h-full rounded-full ${toneStyle.bar}`}
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
    <section className="dashboard-surface dashboard-card-hover p-4 md:p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[#F5A9C4]" />
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
        <BookOpenCheck className="mt-0.5 size-3.5 shrink-0 text-[#F5A9C4]" />
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
