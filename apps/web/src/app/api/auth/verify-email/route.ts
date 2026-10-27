import { NextResponse } from "next/server"

import { verifyEmail } from "@/_entities/auth/index.server"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: unknown }
    await verifyEmail(String(body.token ?? ""))
    return NextResponse.json({ message: "Email đã được xác minh. Bạn có thể đăng nhập." })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể xác minh email"
    return NextResponse.json({ message }, { status: 400 })
  }
}
