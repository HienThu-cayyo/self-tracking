import { NextResponse } from "next/server"

import { resetPassword } from "@/_entities/auth/index.server"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: unknown; password?: unknown }
    await resetPassword(String(body.token ?? ""), String(body.password ?? ""))
    return NextResponse.json({ message: "Mật khẩu đã được cập nhật." })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể đặt lại mật khẩu"
    return NextResponse.json({ message }, { status: 400 })
  }
}
