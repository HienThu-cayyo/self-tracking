"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AuthShell } from "@/_features/auth"

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Xác minh email" subtitle="Đang kiểm tra liên kết…">
          <div />
        </AuthShell>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  )
}

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [message, setMessage] = useState("Đang xác minh email…")
  useEffect(() => {
    void fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (response) => {
      const data = (await response.json()) as { message: string }
      setMessage(data.message)
    })
  }, [token])
  return (
    <AuthShell title="Xác minh email" subtitle="Bảo vệ tài khoản và dữ liệu học tập của bạn.">
      <p className="text-center text-sm text-slate-600 dark:text-slate-300">{message}</p>
      {token && (
        <Link href="/login" className="mt-6 block text-center text-sm text-[#b84f6b]">
          Đi tới đăng nhập
        </Link>
      )}
    </AuthShell>
  )
}
