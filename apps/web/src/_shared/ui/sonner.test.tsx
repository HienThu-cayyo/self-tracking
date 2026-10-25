import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { toast } from "sonner"

import { ThemeProvider } from "./theme-provider"
import { Toaster } from "./sonner"

afterEach(() => toast.dismiss())

function ToastEmitter({ message }: { message: string }) {
  return <button onClick={() => toast(message)}>Emit toast</button>
}

describe("Toaster", () => {
  it("uses the current theme and default toast settings inside ThemeProvider", async () => {
    document.documentElement.classList.add("dark")
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <Toaster />
        <ToastEmitter message="Saved" />
      </ThemeProvider>,
    )

    expect(screen.getByLabelText(/^Thông báo/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Emit toast" }))
    const toaster = await waitFor(() => {
      const element = document.querySelector("[data-sonner-toaster]")
      expect(element).toBeInTheDocument()
      return element!
    })
    expect(toaster).toHaveAttribute("data-sonner-theme", "dark")
    expect(toaster).toHaveAttribute("data-x-position", "right")
    expect(toaster).toHaveAttribute("data-y-position", "top")
    expect(document.querySelector("[data-sonner-toast]")).toHaveAttribute(
      "data-rich-colors",
      "true",
    )
  })

  it("allows props to override theme-derived defaults", async () => {
    document.documentElement.classList.remove("dark")
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <Toaster
          theme="dark"
          position="bottom-left"
          richColors={false}
          containerAriaLabel="Toast updates"
        />
        <ToastEmitter message="Saved with overrides" />
      </ThemeProvider>,
    )

    expect(screen.getByLabelText(/^Toast updates/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Emit toast" }))
    const toaster = await waitFor(() => {
      const element = document.querySelector("[data-sonner-toaster]")
      expect(element).toBeInTheDocument()
      return element!
    })
    expect(toaster).toHaveAttribute("data-sonner-theme", "dark")
    expect(toaster).toHaveAttribute("data-x-position", "left")
    expect(toaster).toHaveAttribute("data-y-position", "bottom")
    expect(document.querySelector("[data-sonner-toast]")).toHaveAttribute(
      "data-rich-colors",
      "false",
    )
  })

  it("throws when rendered outside ThemeProvider", () => {
    expect(() => render(<Toaster />)).toThrow("useTheme must be used within ThemeProvider")
  })
})
