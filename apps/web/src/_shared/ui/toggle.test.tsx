import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Toggle } from "./toggle"

describe("Toggle", () => {
  it("toggles its pressed state and supports the outline variant", async () => {
    const user = userEvent.setup()

    render(
      <>
        <Toggle aria-label="Favorite">Favorite</Toggle>
        <Toggle aria-label="Pinned" variant="outline" size="lg" defaultPressed>
          Pinned
        </Toggle>
        <Toggle aria-label="Unavailable" disabled>
          Unavailable
        </Toggle>
      </>,
    )

    const favorite = screen.getByRole("button", { name: "Favorite" })
    await user.click(favorite)
    expect(favorite).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Pinned" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled()
  })
})
