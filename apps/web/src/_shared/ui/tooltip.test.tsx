import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

describe("Tooltip", () => {
  it("shows accessible content on keyboard focus with the default provider delay", async () => {
    const user = userEvent.setup()

    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Help</TooltipTrigger>
          <TooltipContent>More information</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )

    await user.tab()
    const content = screen.getByText("More information")
    expect(content.closest('[data-slot="tooltip-content"]')).toHaveAttribute("data-open", "")
  })

  it("honors provider delay on hover and accepts placement options", async () => {
    const user = userEvent.setup()

    render(
      <TooltipProvider delay={80}>
        <Tooltip>
          <TooltipTrigger>Save</TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} align="start" alignOffset={2}>
            Save changes
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )

    await user.hover(screen.getByRole("button", { name: "Save" }))
    expect(screen.queryByText("Save changes")).not.toBeInTheDocument()
    const text = await screen.findByText("Save changes")
    const content = text.closest('[data-slot="tooltip-content"]')
    expect(content).toHaveAttribute("data-open", "")
    expect(content).toHaveAttribute("data-side", "bottom")
    expect(content).toHaveAttribute("data-align", "start")
  })
})
