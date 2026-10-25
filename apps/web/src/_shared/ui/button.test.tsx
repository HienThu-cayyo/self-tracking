import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "./button"

describe("Button", () => {
  it("exposes its label and disabled state to assistive technology", () => {
    render(
      <>
        <Button>Save changes</Button>
        <Button disabled>Saving</Button>
      </>,
    )

    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled()
  })

  it("renders supported visual variants and sizes", () => {
    const variants = [
      ["default", "bg-primary"],
      ["outline", "border-border"],
      ["secondary", "bg-secondary"],
      ["ghost", "hover:bg-muted"],
      ["destructive", "bg-destructive/10"],
      ["link", "underline-offset-4"],
    ] as const
    const sizes = [
      ["default", "h-8"],
      ["xs", "h-6"],
      ["sm", "h-7"],
      ["lg", "h-9"],
      ["icon", "size-8"],
      ["icon-xs", "size-6"],
      ["icon-sm", "size-7"],
      ["icon-lg", "size-9"],
    ] as const

    render(
      <>
        {variants.map(([variant]) => (
          <Button key={variant} variant={variant} aria-label={`${variant} button`}>
            {variant}
          </Button>
        ))}
        {sizes.map(([size]) => (
          <Button key={size} size={size} aria-label={`${size} size`}>
            {size}
          </Button>
        ))}
      </>,
    )

    for (const [variant, utility] of variants) {
      expect(screen.getByRole("button", { name: `${variant} button` })).toHaveClass(utility)
    }
    for (const [size, utility] of sizes) {
      expect(screen.getByRole("button", { name: `${size} size` })).toHaveClass(utility)
    }
  })
})
