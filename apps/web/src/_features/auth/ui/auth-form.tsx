"use client"

import { FormEvent, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Mode = "login" | "register"

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [verificationUrl, setVerificationUrl] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")
    setVerificationUrl("")
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
    const payload = mode === "login" ? { email, password } : { name, email, password }
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await response.json()) as { message?: string; verificationUrl?: string }
      if (!response.ok) throw new Error(data.message ?? "Có lỗi xảy ra")
      if (mode === "login") {
        router.replace("/")
        router.refresh()
      } else {
        setMessage(data.message ?? "Tài khoản đã được tạo.")
        setVerificationUrl(data.verificationUrl ?? "")
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Tên hiển thị
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#F9A8BB] dark:border-white/10 dark:bg-white/5"
          />
        </label>
      )}
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#F9A8BB] dark:border-white/10 dark:bg-white/5"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        Mật khẩu
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-[#F9A8BB] dark:border-white/10 dark:bg-white/5"
        />
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {message}
        </p>
      )}
      {verificationUrl && (
        <a href={verificationUrl} className="block text-sm text-[#b84f6b] underline">
          Mở liên kết xác minh trong môi trường phát triển
        </a>
      )}
      <button
        disabled={loading}
        className="h-11 w-full rounded-xl bg-[#F9A8BB] px-4 font-semibold text-[#3f1c29] transition hover:bg-[#f58da8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
      </button>
      <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
        {mode === "login" ? (
          <Link href="/register" className="hover:text-[#b84f6b]">
            Tạo tài khoản
          </Link>
        ) : (
          <Link href="/login" className="hover:text-[#b84f6b]">
            Đã có tài khoản?
          </Link>
        )}
        {mode === "login" && (
          <Link href="/forgot-password" className="hover:text-[#b84f6b]">
            Quên mật khẩu?
          </Link>
        )}
      </div>
    </form>
  )
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8fa] px-5 py-10 text-slate-900 dark:bg-[#101116] dark:text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-[#f6d5df] bg-white p-8 shadow-xl shadow-[#f9c6d4]/20 dark:border-white/10 dark:bg-[#171921]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#F9A8BB] text-xl font-bold text-[#3f1c29]">
            ◎
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  )
}
