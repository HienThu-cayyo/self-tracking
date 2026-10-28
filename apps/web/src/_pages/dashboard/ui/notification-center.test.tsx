import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NotificationCenter } from "./notification-center"

describe("notification center", () => {
  beforeEach(() => localStorage.clear())

  it("opens a reminder, navigates and persists read state for the user", async () => {
    const navigate = vi.fn()
    const props = {
      events: [],
      courses: [{ id: "1", title: "Học IELTS", deadline: "2026-10-29", progress: 0 }],
      now: new Date(2026, 9, 28, 12).getTime(),
      userId: "user-a",
      onNavigate: navigate,
    }
    const { unmount } = render(<NotificationCenter {...props} />)
    await screen.findByLabelText("1 thông báo chưa đọc")
    fireEvent.click(screen.getByRole("button", { name: "Thông báo" }))
    fireEvent.click(screen.getByRole("button", { name: /Học IELTS/ }))
    expect(navigate).toHaveBeenCalledWith("Lộ trình")
    unmount()
    render(<NotificationCenter {...props} />)
    await waitFor(() =>
      expect(screen.queryByLabelText("1 thông báo chưa đọc")).not.toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole("button", { name: "Thông báo" }))
    expect(screen.getByText("Học IELTS")).toBeInTheDocument()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByText("Học IELTS")).not.toBeInTheDocument()
  })
})
