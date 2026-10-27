"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { AuthShell } from "@/_features/auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = (await response.json()) as { message: string }
    setMessage(data.message)
  }
  return (
    <AuthShell title="Khôi phục mật khẩu" subtitle="Nhập email để nhận hướng dẫn khôi phục.">
      <form onSubmit={submit} className="space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5"
        />
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <button className="h-11 w-full rounded-xl bg-[#F9A8BB] font-semibold text-[#3f1c29]">
          Gửi hướng dẫn
        </button>
        <Link href="/login" className="block text-center text-sm text-slate-500">
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthShell>
  )
}
