import { NextResponse } from "next/server"

import { loginUser } from "@/_entities/auth/index.server"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown }
    const user = await loginUser(String(body.email ?? ""), String(body.password ?? ""))
    return NextResponse.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể đăng nhập"
    return NextResponse.json({ message }, { status: 401 })
  }
}
