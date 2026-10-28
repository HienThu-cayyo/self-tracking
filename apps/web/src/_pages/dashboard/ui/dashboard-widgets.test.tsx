import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DailyFocusCard, DailyQuote, StatCard, StreakFlower } from "./dashboard-widgets"

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

  it("uses coordinated pastel progress fills for each KPI tone", () => {
    const props = {
      label: "Progress",
      helper: "Summary",
      icon: <span>Icon</span>,
      onClick: vi.fn(),
    }
    render(
      <>
        <StatCard {...props} value="0%" tone="violet" progress={0} actionLabel="Learning" />
        <StatCard {...props} value="100%" tone="green" progress={100} actionLabel="Tasks" />
        <StatCard {...props} value="50%" tone="amber" progress={50} actionLabel="GPA" />
      </>,
    )

    const learningBar = screen
      .getByRole("button", { name: "Learning" })
      .querySelector(".progress-fill")
    const taskBar = screen.getByRole("button", { name: "Tasks" }).querySelector(".progress-fill")
    const gpaBar = screen.getByRole("button", { name: "GPA" }).querySelector(".progress-fill")

    expect(learningBar).toHaveClass("progress-fill-learning")
    expect(learningBar).toHaveStyle({ width: "0%" })
    expect(taskBar).toHaveClass("progress-fill-tasks")
    expect(taskBar).toHaveStyle({ width: "100%" })
    expect(gpaBar).toHaveClass("progress-fill-gpa")
    expect(gpaBar).toHaveStyle({ width: "50%" })

    const taskIcon = screen.getByRole("button", { name: "Tasks" }).querySelector(".size-9")
    const gpaIcon = screen.getByRole("button", { name: "GPA" }).querySelector(".size-9")
    expect(taskIcon).toHaveClass("bg-emerald-50")
    expect(gpaIcon).toHaveClass("bg-[#FCE7EF]/45")
  })

  it("renders the same accessible flower stages for streak milestones", () => {
    const { rerender } = render(<StreakFlower streak={0} />)
    const flower = screen.getByRole("img", { name: "Hoa streak: 0 ngày liên tục" })
    expect(flower).toHaveAttribute("data-stage", "resting")

    rerender(<StreakFlower streak={1} />)
    expect(screen.getByRole("img", { name: "Hoa streak: 1 ngày liên tục" })).toHaveAttribute(
      "data-stage",
      "bud",
    )

    rerender(<StreakFlower streak={2} />)
    expect(screen.getByRole("img", { name: "Hoa streak: 2 ngày liên tục" })).toHaveAttribute(
      "data-stage",
      "opening",
    )

    rerender(<StreakFlower streak={3} />)
    expect(screen.getByRole("img", { name: "Hoa streak: 3 ngày liên tục" })).toHaveAttribute(
      "data-stage",
      "bloom",
    )

    rerender(<StreakFlower streak={7} />)
    expect(screen.getByRole("img", { name: "Hoa streak: 7 ngày liên tục" })).toHaveAttribute(
      "data-stage",
      "full",
    )
  })
})
