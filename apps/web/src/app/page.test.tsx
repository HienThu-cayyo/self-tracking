import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import Page from "./page"

describe("dashboard home page", () => {
  it("renders the self-tracking dashboard", () => {
    render(<Page />)

    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: /Chào buổi (sáng|chiều|tối), Minh/ }),
    ).toBeInTheDocument()
    expect(screen.getByText("HÔM NAY CỦA BẠN")).toBeInTheDocument()
    expect(screen.getByText("Việc cần ưu tiên")).toBeInTheDocument()
    expect(screen.getByText("Daily focus")).toBeInTheDocument()
    expect(screen.getByText("Tuần này của bạn")).toBeInTheDocument()
    expect(screen.getByText("3 việc còn lại · 4 tổng số")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /Mở tab / })).toHaveLength(3)
  })

  it("opens the related workspace tab from compact summary cards", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Mở tab Lộ trình" }))
    expect(screen.getByRole("heading", { level: 1, name: "Lộ trình" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Về tổng quan" }))
    fireEvent.click(screen.getByRole("button", { name: "Mở tab Việc cần làm" }))
    expect(screen.getByRole("heading", { level: 1, name: "Việc cần làm" })).toBeInTheDocument()
  })

  it("keeps the completed-task KPI in sync when a task is completed", () => {
    render(<Page />)

    fireEvent.click(
      screen.getByRole("button", { name: "Hoàn thành Ôn chương 3: Cấu trúc dữ liệu" }),
    )

    expect(screen.getByText("2/4")).toBeInTheDocument()
  })

  it("adds a task with its time and priority", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm việc" }))
    fireEvent.change(screen.getByPlaceholderText("Bạn cần làm gì?"), {
      target: { value: "Đọc tài liệu" },
    })
    fireEvent.change(screen.getByLabelText("Thời gian hoàn thành"), {
      target: { value: "2026-10-27T19:30" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Khẩn cấp" }))
    fireEvent.click(screen.getByRole("button", { name: "Lưu việc" }))

    expect(screen.getByText("Đọc tài liệu")).toBeInTheDocument()
    expect(screen.getAllByText("Cao")).toHaveLength(3)
  })

  it("adds a course to the tracked learning paths", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả lộ trình" }))
    fireEvent.click(screen.getByRole("button", { name: "Thêm lộ trình" }))
    fireEvent.change(screen.getByLabelText("Tên khóa học"), {
      target: { value: "UI/UX Design" },
    })
    fireEvent.change(screen.getByLabelText("Mục tiêu hoặc thời hạn"), {
      target: { value: "Hoàn thành tháng 11" },
    })
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "35" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm khóa học" }))

    expect(screen.getByText("UI/UX Design")).toBeInTheDocument()
    expect(screen.getByText("35%")).toBeInTheDocument()
  })

  it("splits a lesson list into timeline lessons for a roadmap", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả lộ trình" }))
    fireEvent.click(screen.getAllByRole("button", { name: /^Xem bài học/ })[0])
    fireEvent.change(screen.getByLabelText("Mục lục cho IELTS 7.0"), {
      target: { value: "Bài 1 - Từ vựng, Bài 2 - Ngữ pháp\nBài 3 - Luyện tập" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Thêm bài học cho IELTS 7.0" }))

    expect(screen.getByText("Bài 1 - Từ vựng")).toBeInTheDocument()
    expect(screen.getByText("Bài 2 - Ngữ pháp")).toBeInTheDocument()
    expect(screen.getByText("Bài 3 - Luyện tập")).toBeInTheDocument()
  })

  it("opens the todo form from the todo section and notifications from the header", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm việc" }))
    expect(screen.getByPlaceholderText("Bạn cần làm gì?")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Thông báo" }))
    expect(screen.getByText("Bạn có 2 việc cần hoàn thành trong hôm nay.")).toBeInTheDocument()
  })

  it("opens a dedicated todo tab when viewing all tasks", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả" }))

    expect(screen.getByRole("heading", { level: 1, name: "Việc cần làm" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Tất cả công việc" })).toBeInTheDocument()
    expect(screen.getAllByText("Ôn chương 3: Cấu trúc dữ liệu").length).toBeGreaterThan(0)
    expect(screen.queryByText("Chào buổi sáng, Minh")).not.toBeInTheDocument()
  })

  it("adds a task from the dedicated todo tab", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả" }))
    fireEvent.click(screen.getByRole("button", { name: "Thêm việc" }))
    fireEvent.change(screen.getByPlaceholderText("Bạn cần làm gì?"), {
      target: { value: "Ôn bài kiểm tra" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Khẩn cấp" }))
    fireEvent.click(screen.getByRole("button", { name: "Lưu việc" }))

    expect(screen.getAllByText("Ôn bài kiểm tra").length).toBeGreaterThan(0)
  })

  it("sets and starts a focus timer for a task", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả" }))
    fireEvent.change(screen.getByLabelText("Số phút timer"), { target: { value: "30" } })
    fireEvent.click(screen.getByRole("button", { name: "Đặt" }))

    expect(screen.getByText("30:00")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Bắt đầu phiên học|Tiếp tục timer/ }))
    expect(screen.getByRole("button", { name: "Tạm dừng timer" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Tạm dừng timer" }))
  })

  it("pauses and resets the standalone focus timer", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả" }))
    fireEvent.click(screen.getByRole("button", { name: "25 phút" }))
    fireEvent.click(screen.getByRole("button", { name: /Bắt đầu phiên học|Tiếp tục timer/ }))
    fireEvent.click(screen.getByRole("button", { name: "Tạm dừng timer" }))

    expect(screen.getByRole("button", { name: "Tiếp tục timer" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại timer" }))

    expect(
      screen.getByRole("button", { name: /Bắt đầu phiên học|Tiếp tục timer/ }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Bắt đầu timer cho/ })).not.toBeInTheDocument()
  })

  it("opens the todo timer from the streak card", () => {
    render(<Page />)

    fireEvent.click(screen.getAllByRole("button", { name: "Mở timer học tập" })[0])

    expect(screen.getByRole("heading", { level: 1, name: "Việc cần làm" })).toBeInTheDocument()
    expect(screen.getByText("Timer tập trung")).toBeInTheDocument()
  })

  it("toggles and remembers the light and dark theme", () => {
    render(<Page />)

    const themeButton = screen.getByRole("button", { name: "Chuyển sang chế độ sáng" })
    fireEvent.click(themeButton)

    expect(document.documentElement).not.toHaveClass("dark")
    expect(screen.getByRole("button", { name: "Chuyển sang chế độ tối" })).toBeInTheDocument()
    expect(window.localStorage.getItem("self-track-theme")).toBe("light")
  })

  it("opens the roadmap tab from the tracked roadmap card", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả lộ trình" }))

    expect(screen.getByRole("heading", { level: 1, name: "Lộ trình" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 2, name: "Lộ trình đang theo dõi" }),
    ).toBeInTheDocument()
    expect(screen.getByText("IELTS 7.0")).toBeInTheDocument()
  })

  it("opens the subjects tab from subject progress", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Quản lý môn học" }))

    expect(screen.getByRole("heading", { level: 1, name: "Môn học" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Tiến độ môn học" })).toBeInTheDocument()
    expect(screen.getByText("Cấu trúc dữ liệu")).toBeInTheDocument()
  })

  it("tracks subject completion and credits per semester", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Quản lý môn học" }))
    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu hoàn thành Cấu trúc dữ liệu" }))

    expect(screen.getAllByText("Đã hoàn thành").length).toBeGreaterThan(0)
    expect(screen.getByText("3/10 tín chỉ")).toBeInTheDocument()
    expect(screen.getByText("7 tín chỉ")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Thiết lập tổng tín chỉ" }))
    fireEvent.change(screen.getByLabelText("Tổng tín chỉ cần hoàn thành"), {
      target: { value: "12" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu tổng tín chỉ" }))

    expect(screen.getByText("3/12 tín chỉ")).toBeInTheDocument()
    expect(screen.getByText("9 tín chỉ")).toBeInTheDocument()
  })

  it("sets the current and target GPA from the subjects tab", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Quản lý môn học" }))
    fireEvent.click(screen.getByRole("button", { name: "Thiết lập GPA" }))
    fireEvent.change(screen.getByLabelText("GPA hiện tại"), { target: { value: "3.5" } })
    fireEvent.change(screen.getByLabelText("GPA mục tiêu"), { target: { value: "3.8" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu GPA" }))

    expect(screen.getByText("3.50")).toBeInTheDocument()
    expect(screen.getByText("Mục tiêu 3.80")).toBeInTheDocument()
  })

  it("adds a subject to a selected semester", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Quản lý môn học" }))
    fireEvent.click(screen.getByRole("button", { name: "Thêm môn học" }))
    fireEvent.change(screen.getByLabelText("Tên môn học"), {
      target: { value: "Thiết kế giao diện" },
    })
    fireEvent.change(screen.getByLabelText("Mã môn"), { target: { value: "DES101" } })
    fireEvent.change(screen.getByLabelText("Số tín chỉ"), { target: { value: "2" } })
    fireEvent.change(screen.getByLabelText("Học kỳ của môn học"), {
      target: { value: "Học kỳ 2" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu môn học" }))
    fireEvent.change(screen.getByLabelText("Bộ lọc học kỳ"), {
      target: { value: "Học kỳ 2" },
    })

    expect(screen.getByText("Thiết kế giao diện")).toBeInTheDocument()
    expect(screen.getByText("DES101 · 2 tín chỉ · Học kỳ 2")).toBeInTheDocument()
  })

  it("opens my calendar from upcoming events", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Mở lịch của tôi" }))

    expect(screen.getByRole("heading", { level: 1, name: "Lịch của tôi" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Lịch sắp tới" })).toBeInTheDocument()
    expect(screen.getByText("Nộp bài tập lớn tuần 5")).toBeInTheDocument()
  })

  it("removes a completed task and restores it with undo", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả" }))
    fireEvent.click(
      screen.getByRole("button", { name: "Hoàn thành Ôn chương 3: Cấu trúc dữ liệu" }),
    )

    expect(screen.queryByText("Ôn chương 3: Cấu trúc dữ liệu")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Hoàn tác" }))
    expect(screen.getAllByText("Ôn chương 3: Cấu trúc dữ liệu").length).toBeGreaterThan(0)
  })

  it("reviews completed tasks and moves one to trash", () => {
    render(<Page />)

    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả" }))
    fireEvent.click(screen.getByRole("button", { name: /Đã hoàn thành/ }))

    expect(screen.getByText("Luyện Speaking Part 2")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Đưa vào thùng rác Luyện Speaking Part 2" }))

    expect(screen.queryByText("Luyện Speaking Part 2")).not.toBeInTheDocument()
  })
})
