import { NextResponse } from "next/server"

import { logoutUser } from "@/_entities/auth/index.server"

export async function POST() {
  try {
    await logoutUser()
  } catch {
    // The session cookie is cleared in logoutUser's finally block. An orphaned
    // database session is harmless because it is no longer held by the client.
  }
  return NextResponse.json({ ok: true })
}
