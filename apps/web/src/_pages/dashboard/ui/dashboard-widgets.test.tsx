import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DailyFocusCard, DailyQuote } from "./dashboard-widgets"

describe("dashboard widgets", () => {
  it("renders a balanced pair of quote marks", () => {
    render(<DailyQuote quote="Tập trung vào bước tiếp theo." />)

    expect(screen.getByText("“Tập trung vào bước tiếp theo.”")).toBeInTheDocument()
  })

  it("offers a first-task action when there is no priority task", () => {
    const onAddTask = vi.fn()
    render(<DailyFocusCard minutes={0} streak={0} onStart={vi.fn()} onAddTask={onAddTask} />)

    screen.getByRole("button", { name: "Thêm việc đầu tiên" }).click()
    expect(onAddTask).toHaveBeenCalledOnce()
  })
})
