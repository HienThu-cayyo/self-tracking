import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

describe("ToggleGroup", () => {
  it("uses vertical arrow-key navigation when orientation is vertical", async () => {
    const user = userEvent.setup()

    render(
      <ToggleGroup aria-label="Display mode" orientation="vertical">
        <ToggleGroupItem value="first">First</ToggleGroupItem>
        <ToggleGroupItem value="second">Second</ToggleGroupItem>
      </ToggleGroup>,
    )

    const first = screen.getByRole("button", { name: "First" })
    const second = screen.getByRole("button", { name: "Second" })
    first.focus()

    await user.keyboard("{ArrowDown}")

    expect(second).toHaveFocus()
  })

  it("inherits group variants and falls back to an item variant when unset", () => {
    render(
      <>
        <ToggleGroup aria-label="Text style" variant="outline" size="sm" spacing={0}>
          <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup aria-label="Display mode">
          <ToggleGroupItem value="compact" variant="outline" size="lg">
            Compact
          </ToggleGroupItem>
        </ToggleGroup>
      </>,
    )

    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("data-variant", "outline")
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("data-size", "sm")
    expect(screen.getByRole("button", { name: "Compact" })).toHaveAttribute(
      "data-variant",
      "outline",
    )
    expect(screen.getByRole("button", { name: "Compact" })).toHaveAttribute("data-size", "lg")
  })
})
