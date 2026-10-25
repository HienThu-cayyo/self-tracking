import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Badge } from "./badge"

describe("Badge", () => {
  it("renders each visual variant with its declared state", () => {
    const variants = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const

    render(
      <div>
        {variants.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </div>,
    )

    for (const variant of variants) {
      expect(screen.getByText(variant)).toHaveAttribute("data-variant", variant)
    }
  })

  it("can render as a link while preserving its accessible name", () => {
    render(<Badge render={<a href="/reports" />}>Reports</Badge>)

    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute("href", "/reports")
  })
})
