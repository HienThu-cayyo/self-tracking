import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import Page from "./page"

describe("dashboard home page", () => {
  it("renders the self-tracking dashboard", () => {
    render(<Page />)

    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: /Chào buổi sáng, Minh/ }),
    ).toBeInTheDocument()
    expect(screen.getByText("Việc cần ưu tiên")).toBeInTheDocument()
  })
})
