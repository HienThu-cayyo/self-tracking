import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ThemeProvider, useTheme } from "./theme-provider"

function ThemeProbe() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <span>Current theme: {theme}</span>
      <button onClick={() => setTheme("light")}>Use light theme</button>
      <button onClick={() => setTheme("dark")}>Use dark theme</button>
    </div>
  )
}

describe("ThemeProvider", () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    ["light", false],
    ["dark", true],
  ] as const)("initializes from the document's %s class state", (theme, isDark) => {
    document.documentElement.classList.toggle("dark", isDark)
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    expect(screen.getByText(`Current theme: ${theme}`)).toBeInTheDocument()
  })

  it("updates the document class, color scheme, and local storage", async () => {
    document.documentElement.classList.remove("dark")
    const storage = { setItem: vi.fn() }
    vi.stubGlobal("localStorage", storage)
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Use dark theme" }))
    expect(screen.getByText("Current theme: dark")).toBeInTheDocument()
    expect(document.documentElement).toHaveClass("dark")
    expect(document.documentElement.style.colorScheme).toBe("dark")
    expect(storage.setItem).toHaveBeenCalledWith("smart-base-theme", "dark")

    await user.click(screen.getByRole("button", { name: "Use light theme" }))
    expect(screen.getByText("Current theme: light")).toBeInTheDocument()
    expect(document.documentElement).not.toHaveClass("dark")
    expect(document.documentElement.style.colorScheme).toBe("light")
    expect(storage.setItem).toHaveBeenCalledWith("smart-base-theme", "light")
  })

  it("keeps the visual theme when browser storage throws", async () => {
    document.documentElement.classList.remove("dark")
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("Storage is unavailable")
      },
    })
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Use dark theme" }))
    expect(screen.getByText("Current theme: dark")).toBeInTheDocument()
    expect(document.documentElement).toHaveClass("dark")
    expect(document.documentElement.style.colorScheme).toBe("dark")
  })

  it("uses dark as the server snapshot without accessing the document", () => {
    const browserDocument = document
    vi.stubGlobal("document", undefined)
    try {
      expect(
        renderToString(
          <ThemeProvider>
            <ThemeProbe />
          </ThemeProvider>,
        ),
      ).toContain("<!-- -->dark")
    } finally {
      vi.stubGlobal("document", browserDocument)
    }
  })

  it("throws when useTheme is used without its provider", () => {
    expect(() => render(<ThemeProbe />)).toThrow("useTheme must be used within ThemeProvider")
  })
})
