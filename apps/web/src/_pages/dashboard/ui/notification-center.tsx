"use client"

import { Bell } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { CalendarEvent } from "../model/calendar"
import { getDashboardNotices } from "../model/notifications"

type Course = { id: string | number; title: string; deadline: string | null; progress: number }
type Saved = { read: string[]; sent: string[] }
const emptySaved: Saved = { read: [], sent: [] }

function readSaved(key: string): Saved {
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? "null") as Saved | null
    return {
      read: Array.isArray(data?.read) ? data.read : [],
      sent: Array.isArray(data?.sent) ? data.sent : [],
    }
  } catch {
    return emptySaved
  }
}

export function NotificationCenter({
  events,
  courses,
  now,
  userId,
  onNavigate,
}: {
  events: CalendarEvent[]
  courses: Course[]
  now: number
  userId: string
  onNavigate: (destination: "Lịch của tôi" | "Lộ trình") => void
}) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState<Saved>(emptySaved)
  const [loadedKey, setLoadedKey] = useState("")
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  )
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const storageKey = userId ? `self-track-notifications:${userId}` : ""
  const notices = useMemo(
    () =>
      now && userId && loadedKey === storageKey
        ? getDashboardNotices(events, courses, new Date(now))
        : [],
    [events, courses, now, userId, loadedKey, storageKey],
  )
  const unread = notices.filter((notice) => !saved.read.includes(notice.key))

  useEffect(() => {
    let active = true
    function refresh() {
      if (!active) return
      setSaved(storageKey ? readSaved(storageKey) : emptySaved)
      setLoadedKey(storageKey)
      setPermission("Notification" in window ? Notification.permission : "unsupported")
    }
    queueMicrotask(refresh)
    window.addEventListener("storage", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      active = false
      window.removeEventListener("storage", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || loadedKey !== storageKey || permission !== "granted" || !notices.length)
      return
    const latest = readSaved(storageKey)
    const unsent = notices.filter((notice) => !latest.sent.includes(notice.key))
    if (!unsent.length) return
    const next = { ...latest, sent: [...latest.sent, ...unsent.map((notice) => notice.key)] }
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      return
    }
    for (const notice of unsent) {
      try {
        new Notification(notice.title, { body: notice.detail, tag: notice.key })
      } catch {
        /* browser may not support the constructor */
      }
    }
  }, [notices, permission, storageKey, loadedKey])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [open])

  function markRead(keys: string[]) {
    if (!storageKey || loadedKey !== storageKey) return
    const current = readSaved(storageKey)
    const next = { ...current, read: [...new Set([...current.read, ...keys])] }
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      /* keep the in-memory state */
    }
    setSaved(next)
  }

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label="Thông báo"
        aria-expanded={open}
        aria-controls="dashboard-notifications"
        onClick={() => setOpen(!open)}
        className="dashboard-focus relative rounded-lg p-1.5 text-slate-500 hover:bg-pink-50 dark:text-slate-300 dark:hover:bg-white/5"
      >
        <Bell className="size-[19px]" />
        {unread.length > 0 && (
          <span
            aria-label={`${unread.length} thông báo chưa đọc`}
            className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white"
          >
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <div
          id="dashboard-notifications"
          className="fixed right-3 top-16 z-50 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-white/15 dark:bg-[#20222c] dark:text-slate-100 sm:absolute sm:right-0 sm:top-full sm:mt-3"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-white/10">
            <h2 className="text-sm font-semibold">Thông báo</h2>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={() => markRead(notices.map((notice) => notice.key))}
                className="dashboard-focus rounded text-xs font-semibold text-rose-700 dark:text-pink-200"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="max-h-[min(24rem,55vh)] overflow-y-auto">
            {notices.length ? (
              notices.map((notice) => (
                <button
                  key={notice.key}
                  type="button"
                  onClick={() => {
                    markRead([notice.key])
                    setOpen(false)
                    onNavigate(notice.destination)
                  }}
                  className="dashboard-focus flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-rose-50 dark:border-white/5 dark:hover:bg-white/5"
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${saved.read.includes(notice.key) ? "bg-slate-300 dark:bg-slate-600" : "bg-rose-500"}`}
                  />
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-semibold">{notice.title}</span>
                    <span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">
                      {notice.detail} · {notice.destination}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Bạn chưa có thông báo nào.
              </p>
            )}
          </div>
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
            {permission === "default" ? (
              <button
                type="button"
                onClick={() => {
                  void Notification.requestPermission()
                    .then(setPermission)
                    .catch(() => setPermission("denied"))
                }}
                className="dashboard-focus rounded font-semibold text-rose-700 dark:text-pink-200"
              >
                Bật thông báo trình duyệt
              </button>
            ) : permission === "granted" ? (
              "Thông báo trình duyệt đã bật"
            ) : permission === "denied" ? (
              "Thông báo trình duyệt bị chặn; bạn vẫn nhận thông báo trong ứng dụng."
            ) : (
              "Trình duyệt không hỗ trợ thông báo; bạn vẫn nhận thông báo trong ứng dụng."
            )}
          </div>
        </div>
      )}
    </div>
  )
}
