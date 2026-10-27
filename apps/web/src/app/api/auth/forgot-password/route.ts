import { NextResponse } from "next/server"

import { requestPasswordReset } from "@/_entities/auth/index.server"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown }
    await requestPasswordReset(String(body.email ?? ""))
    return NextResponse.json({ message: "Nếu email tồn tại, liên kết khôi phục đã được gửi." })
  } catch {
    return NextResponse.json({ message: "Nếu email tồn tại, liên kết khôi phục đã được gửi." })
  }
}
