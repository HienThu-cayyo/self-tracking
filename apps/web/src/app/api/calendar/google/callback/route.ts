import { NextRequest, NextResponse } from "next/server"

import { getCurrentUser } from "@/_entities/auth/index.server"
import {
  encryptGoogleToken,
  exchangeGoogleCode,
  getGoogleAccount,
} from "@/_entities/calendar/index.server"
import { googleCalendarConnections, getDb } from "@smart-base/database/server"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const url = new URL(request.url)
  const redirectBase = process.env.AUTH_APP_URL ?? "http://127.0.0.1:3000"
  if (!user) return NextResponse.redirect(new URL("/login", redirectBase))
  if (url.searchParams.get("state") !== request.cookies.get("google_calendar_oauth_state")?.value) {
    return NextResponse.json({ message: "OAuth state không hợp lệ" }, { status: 400 })
  }
  const code = url.searchParams.get("code")
  if (!code) return NextResponse.json({ message: "Thiếu mã xác thực Google" }, { status: 400 })
  try {
    const token = await exchangeGoogleCode(code)
    if (!token.refresh_token) throw new Error("Google không trả refresh token")
    const account = await getGoogleAccount(token.access_token)
    await getDb()
      .insert(googleCalendarConnections)
      .values({
        userId: user.id,
        googleAccountId: account.sub,
        accessTokenEncrypted: encryptGoogleToken(token.access_token),
        refreshTokenEncrypted: encryptGoogleToken(token.refresh_token),
        tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        selectedCalendarIds: [],
        keywords: ["thi", "exam", "kiểm tra", "deadline", "event"],
      })
      .onConflictDoUpdate({
        target: googleCalendarConnections.userId,
        set: {
          googleAccountId: account.sub,
          accessTokenEncrypted: encryptGoogleToken(token.access_token),
          refreshTokenEncrypted: encryptGoogleToken(token.refresh_token),
          tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
          syncError: null,
          updatedAt: new Date(),
        },
      })
    return NextResponse.redirect(new URL("/?google=connected", redirectBase))
  } catch {
    return NextResponse.redirect(new URL("/?google=error", redirectBase))
  }
}
