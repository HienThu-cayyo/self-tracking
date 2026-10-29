import type { Metadata } from "next"
import type { ReactNode } from "react"

import { AppProviders } from "@/_app/providers"

import "./globals.css"

export const metadata: Metadata = {
  title: "self.track — Quản lý việc học và mục tiêu",
  description: "Theo dõi tiến độ học tập, deadline và mục tiêu cá nhân tại một nơi.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" className="dark">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
