import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/") || pathname.includes("."))
    return NextResponse.next()
  if (publicPaths.has(pathname)) {
    if (request.cookies.has("self_track_session"))
      return NextResponse.redirect(new URL("/", request.url))
    return NextResponse.next()
  }
  if (pathname === "/") return NextResponse.next()
  if (!request.cookies.has("self_track_session"))
    return NextResponse.redirect(new URL("/login", request.url))
  return NextResponse.next()
}

export const config = { matcher: ["/:path*"] }
