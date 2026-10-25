import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Spinner } from "./spinner"

describe("Spinner", () => {
  it("announces its loading status and forwards SVG props", () => {
    render(<Spinner data-testid="loading-spinner" className="text-primary" />)

    expect(screen.getByRole("status", { name: "Đang tải" })).toHaveClass("text-primary")
    expect(screen.getByTestId("loading-spinner").tagName.toLowerCase()).toBe("svg")
  })
})
