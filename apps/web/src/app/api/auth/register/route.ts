import { NextResponse } from "next/server"

import { registerUser } from "@/_entities/auth/index.server"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: unknown; email?: unknown; password?: unknown }
    const result = await registerUser(
      String(body.name ?? ""),
      String(body.email ?? ""),
      String(body.password ?? ""),
    )
    return NextResponse.json(
      {
        message: "Tài khoản đã được tạo. Hãy xác minh email để đăng nhập.",
        verificationUrl: process.env.NODE_ENV === "production" ? undefined : result.verificationUrl,
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tạo tài khoản"
    return NextResponse.json({ message }, { status: 400 })
  }
}
