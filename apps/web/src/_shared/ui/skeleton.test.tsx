import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Skeleton } from "./skeleton"

describe("Skeleton", () => {
  it("forwards caller classes and data attributes", () => {
    render(<Skeleton data-testid="loading-row" className="h-8" />)

    expect(screen.getByTestId("loading-row")).toHaveClass("h-8", "animate-pulse")
  })
})
