import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { FocusTimerPanel, TaskRow, type Task } from "./dashboard-page"

const task: Task = {
  id: 7,
  title: "Ôn chương 3",
  subject: "Cấu trúc dữ liệu",
  due: "Hôm nay, 18:00",
  priority: "Vừa",
  done: false,
}

afterEach(() => {
  vi.useRealTimers()
})

describe("TaskRow", () => {
  it("edits the title and moves a task to another priority", () => {
    const onEdit = vi.fn()
    render(<TaskRow task={task} onToggle={vi.fn()} onEdit={onEdit} />)

    fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa Ôn chương 3" }))
    fireEvent.change(screen.getByLabelText("Tên công việc"), {
      target: { value: "Ôn chương 4" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Khẩn cấp" }))
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }))

    expect(onEdit).toHaveBeenCalledExactlyOnceWith(7, "Ôn chương 4", "Cao")
  })

  it("celebrates a task completion before moving it out of the active list", () => {
    vi.useFakeTimers()
    const onToggle = vi.fn()
    render(<TaskRow task={task} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole("button", { name: "Hoàn thành Ôn chương 3" }))

    expect(screen.getByRole("status")).toHaveTextContent("Hoàn thành!")
    expect(screen.getByRole("button", { name: "Đang hoàn thành Ôn chương 3" })).toBeDisabled()
    expect(onToggle).not.toHaveBeenCalled()

    vi.advanceTimersByTime(700)

    expect(onToggle).toHaveBeenCalledExactlyOnceWith(7)
  })

  it("does not trigger completion more than once while the flower is blooming", () => {
    vi.useFakeTimers()
    const onToggle = vi.fn()
    render(<TaskRow task={task} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole("button", { name: "Hoàn thành Ôn chương 3" }))
    fireEvent.click(screen.getByRole("button", { name: "Đang hoàn thành Ôn chương 3" }))
    vi.advanceTimersByTime(700)

    expect(onToggle).toHaveBeenCalledExactlyOnceWith(7)
  })

  it("keeps reduced-motion celebrations brief", () => {
    vi.useFakeTimers()
    const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia")
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    })
    const onToggle = vi.fn()
    render(<TaskRow task={task} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole("button", { name: "Hoàn thành Ôn chương 3" }))
    vi.advanceTimersByTime(160)

    expect(onToggle).toHaveBeenCalledExactlyOnceWith(7)
    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", originalMatchMedia)
    } else {
      Reflect.deleteProperty(window, "matchMedia")
    }
  })

  it("allows an already completed task to be toggled back immediately", () => {
    const onToggle = vi.fn()
    render(<TaskRow task={{ ...task, done: true }} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole("button", { name: "Bỏ hoàn thành Ôn chương 3" }))

    expect(onToggle).toHaveBeenCalledExactlyOnceWith(7)
  })
})

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
    const { rerender } = render(
      <FocusTimerPanel
        focusTimer={timer}
        now={0}
        quote="A little progress is still progress."
        {...callbacks}
      />,
    )

    expect(screen.getByText("“A little progress is still progress.”")).toBeInTheDocument()
    expect(screen.queryByText("Một phiên học, một bước tiến")).not.toBeInTheDocument()
    expect(screen.queryByText(/Timer hoạt động độc lập/)).not.toBeInTheDocument()

    rerender(
      <FocusTimerPanel
        focusTimer={{ ...timer, elapsedSeconds: 60 }}
        now={0}
        quote="A little progress is still progress."
        {...callbacks}
      />,
    )

    expect(screen.getByRole("status")).toHaveTextContent("Mục tiêu hoàn thành!")
  })
})
