import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { FocusTimerPanel } from "./dashboard-page"

describe("FocusTimerPanel", () => {
  it("shows a celebration when the focus timer reaches zero", () => {
    const callbacks = {
      onSetTimer: vi.fn(),
      onStartTimer: vi.fn(),
      onPauseTimer: vi.fn(),
      onResetTimer: vi.fn(),
    }
    const timer = {
      taskId: null,
      durationSeconds: 60,
      elapsedSeconds: 0,
      startedAt: null,
      lastAccountedAt: null,
    }
    const { rerender } = render(<FocusTimerPanel focusTimer={timer} now={0} {...callbacks} />)

    rerender(
      <FocusTimerPanel focusTimer={{ ...timer, elapsedSeconds: 60 }} now={0} {...callbacks} />,
    )

    expect(screen.getByRole("status")).toHaveTextContent("Mục tiêu hoàn thành!")
  })
})
