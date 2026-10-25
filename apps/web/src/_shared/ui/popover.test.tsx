import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover"

describe("Popover", () => {
  it("opens accessible content and closes from its trigger", async () => {
    const user = userEvent.setup()

    render(
      <Popover>
        <PopoverTrigger>Open details</PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Details</PopoverTitle>
            <PopoverDescription>Additional project information.</PopoverDescription>
          </PopoverHeader>
          <p>Last updated today.</p>
        </PopoverContent>
      </Popover>,
    )

    const trigger = screen.getByRole("button", { name: "Open details" })
    await user.click(trigger)
    expect(screen.getByRole("dialog", { name: "Details" })).toBeInTheDocument()
    expect(screen.getByText("Additional project information.")).toBeInTheDocument()

    await user.click(trigger)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("supports alternate side and alignment options", async () => {
    const user = userEvent.setup()

    render(
      <Popover>
        <PopoverTrigger>Open aligned panel</PopoverTrigger>
        <PopoverContent side="right" sideOffset={12} align="start" alignOffset={4}>
          Aligned content
        </PopoverContent>
      </Popover>,
    )

    await user.click(screen.getByRole("button", { name: "Open aligned panel" }))
    expect(screen.getByRole("dialog")).toHaveTextContent("Aligned content")
  })
})
