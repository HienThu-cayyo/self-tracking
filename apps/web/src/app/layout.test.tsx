import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import RootLayout, { metadata } from "./layout"

describe("RootLayout", () => {
  it("exports product metadata and renders the document shell with providers", () => {
    expect(metadata).toEqual({
      title: "self.track — Quản lý việc học và mục tiêu",
      description: "Theo dõi tiến độ học tập, deadline và mục tiêu cá nhân tại một nơi.",
      icons: {
        icon: "/icon.png",
        apple: "/icon.png",
      },
    })

    const markup = renderToStaticMarkup(
      <RootLayout>
        <main>Starter route content</main>
      </RootLayout>,
    )

    expect(markup).toContain('<html lang="vi" class="dark">')
    expect(markup).toContain("<body>")
    expect(markup).toContain("Starter route content")
    expect(markup).toContain('aria-label="Thông báo alt+T"')
  })
})
