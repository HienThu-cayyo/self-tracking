import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

import { getCurrentUser } from "@/_entities/auth/index.server"
import { googleAuthorizationUrl } from "@/_entities/calendar/index.server"

export async function GET() {
  const user = await getCurrentUser()
  if (!user)
    return NextResponse.redirect(
      new URL("/login", process.env.AUTH_APP_URL ?? "http://127.0.0.1:3000"),
    )
  try {
    const state = randomUUID()
    const response = NextResponse.redirect(googleAuthorizationUrl(state))
    response.cookies.set("google_calendar_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    })
    return response
  } catch {
    return NextResponse.json({ message: "Google Calendar chưa được cấu hình" }, { status: 503 })
  }
}
