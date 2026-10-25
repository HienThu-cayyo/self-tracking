import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { fr } from "react-day-picker/locale"
import { describe, expect, it } from "vitest"

import { Calendar } from "./calendar"

const firstOfOctober = new Date(2025, 9, 1)

function getDay(date: Date) {
  return document.querySelector<HTMLButtonElement>(
    `button[data-day="${date.toLocaleDateString()}"]`,
  )
}

describe("Calendar", () => {
  it("selects a single day and moves DOM focus with ArrowRight", async () => {
    const user = userEvent.setup()
    const secondDate = new Date(2025, 9, 2)

    render(<Calendar mode="single" defaultMonth={firstOfOctober} today={firstOfOctober} />)

    const first = getDay(firstOfOctober)
    const second = getDay(secondDate)
    expect(first).not.toBeNull()
    expect(second).not.toBeNull()

    await user.click(first!)
    expect(first).toHaveAttribute("data-selected-single", "true")
    await user.keyboard("{ArrowRight}")

    expect(second).toHaveFocus()
  })

  it("marks range endpoints and middle days and renders week numbers", async () => {
    const user = userEvent.setup()
    const start = new Date(2025, 9, 2)
    const middle = new Date(2025, 9, 3)
    const end = new Date(2025, 9, 4)

    render(
      <Calendar
        mode="range"
        defaultMonth={firstOfOctober}
        today={firstOfOctober}
        showWeekNumber
        classNames={{ day: "custom-day" }}
      />,
    )

    await user.click(getDay(start)!)
    await user.click(getDay(end)!)

    expect(getDay(start)).toHaveAttribute("data-range-start", "true")
    expect(getDay(middle)).toHaveAttribute("data-range-middle", "true")
    expect(getDay(end)).toHaveAttribute("data-range-end", "true")
    expect(getDay(start)?.closest("td")).toHaveClass("custom-day")
    expect(screen.getByRole("grid").querySelectorAll("th[aria-label='Week Number']")).toHaveLength(
      1,
    )
  })

  it("renders outside days and disables dates before the configured boundary", () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={firstOfOctober}
        today={firstOfOctober}
        disabled={{ before: firstOfOctober }}
        className="custom-calendar"
      />,
    )

    const outside = getDay(new Date(2025, 8, 30))
    const disabled = getDay(firstOfOctober)
    expect(document.querySelector('[data-slot="calendar"]')).toHaveClass("custom-calendar")
    expect(outside).not.toBeNull()
    expect(outside).toBeDisabled()
    expect(disabled).toBeEnabled()
  })

  it.each(["around", "after"] as const)(
    "renders dropdown captions with %s navigation layout and custom formatters",
    (navLayout) => {
      render(
        <Calendar
          mode="single"
          defaultMonth={firstOfOctober}
          today={firstOfOctober}
          captionLayout="dropdown"
          navLayout={navLayout}
          startMonth={new Date(2025, 9, 1)}
          endMonth={new Date(2025, 10, 1)}
          formatters={{
            formatMonthDropdown: () => "Oct custom",
            formatDay: () => "day",
          }}
        />,
      )

      expect(screen.getByRole("combobox", { name: "Choose the Month" })).toHaveTextContent(
        "Oct custom",
      )
      expect(screen.getByRole("button", { name: "Go to the Previous Month" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Go to the Next Month" })).toBeInTheDocument()
      expect(screen.getAllByText("day").length).toBeGreaterThan(0)
    },
  )

  it("formats month dropdowns with the default formatter", () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={firstOfOctober}
        today={firstOfOctober}
        captionLayout="dropdown-months"
        startMonth={firstOfOctober}
        endMonth={new Date(2025, 10, 1)}
      />,
    )

    expect(screen.getByRole("combobox", { name: "Choose the Month" })).toHaveTextContent(
      firstOfOctober.toLocaleString(undefined, { month: "short" }),
    )
  })

  it("uses the supplied locale for date attributes and month options", () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={firstOfOctober}
        today={firstOfOctober}
        captionLayout="dropdown-months"
        startMonth={firstOfOctober}
        endMonth={new Date(2025, 10, 1)}
        locale={fr}
      />,
    )

    expect(screen.getByRole("combobox", { name: "Choisir le mois" })).toHaveTextContent("oct.")
    expect(document.querySelector('button[data-day="01/10/2025"]')).toBeInTheDocument()
  })

  it("renders overridden calendar components and formatter options", () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={firstOfOctober}
        today={firstOfOctober}
        captionLayout="label"
        showWeekNumber
        components={{
          Root: ({ children, className, rootRef, ...props }) => (
            <section data-slot="calendar" ref={rootRef} className={className} {...props}>
              {children}
            </section>
          ),
          Chevron: ({ orientation }) => <span>{orientation}</span>,
          WeekNumber: ({ children, ...props }) => (
            <td {...props}>
              <b>{children}</b>
            </td>
          ),
        }}
        formatters={{ formatWeekNumber: () => "W" }}
      />,
    )

    expect(screen.getByText("left")).toBeInTheDocument()
    expect(screen.getByText("right")).toBeInTheDocument()
    expect(screen.getAllByText("W").length).toBeGreaterThan(0)
    expect(screen.getByRole("grid").querySelectorAll("b").length).toBeGreaterThan(0)
  })
})
