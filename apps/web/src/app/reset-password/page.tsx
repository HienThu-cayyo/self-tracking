"use client"

import { FormEvent, Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AuthShell } from "@/_features/auth"

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Đặt lại mật khẩu" subtitle="Đang tải biểu mẫu đặt lại mật khẩu…">
          <div />
        </AuthShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = searchParams.get("token") ?? ""
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    })
    const data = (await response.json()) as { message: string }
    setMessage(data.message)
  }
  return (
    <AuthShell title="Đặt lại mật khẩu" subtitle="Tạo mật khẩu mới cho tài khoản của bạn.">
      <form onSubmit={submit} className="space-y-4">
        <input
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mật khẩu mới"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5"
        />
        {message && <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>}
        <button className="h-11 w-full rounded-xl bg-[#F5A9C4] font-semibold text-[#3f1c29]">
          Cập nhật mật khẩu
        </button>
        <Link href="/login" className="block text-center text-sm text-slate-500">
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthShell>
  )
}
