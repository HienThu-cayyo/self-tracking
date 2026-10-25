import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet"

describe("Sheet", () => {
  it("opens on the default side and closes through its built-in button", async () => {
    const user = userEvent.setup()

    render(
      <Sheet>
        <SheetTrigger>Open settings sheet</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Manage your account preferences.</SheetDescription>
          </SheetHeader>
          <SheetFooter>Saved automatically</SheetFooter>
        </SheetContent>
      </Sheet>,
    )

    await user.click(screen.getByRole("button", { name: "Open settings sheet" }))
    expect(screen.getByRole("dialog", { name: "Settings" })).toHaveAttribute("data-side", "right")
    expect(screen.getByText("Manage your account preferences.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Close" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it.each(["top", "bottom", "left"] as const)(
    "supports the %s side and a custom close action without the built-in button",
    async (side) => {
      const user = userEvent.setup()

      render(
        <Sheet>
          <SheetTrigger>Open {side} sheet</SheetTrigger>
          <SheetContent side={side} showCloseButton={false}>
            <SheetTitle>{side} panel</SheetTitle>
            <SheetClose>Done</SheetClose>
          </SheetContent>
        </Sheet>,
      )

      await user.click(screen.getByRole("button", { name: `Open ${side} sheet` }))
      expect(screen.getByRole("dialog", { name: `${side} panel` })).toHaveAttribute(
        "data-side",
        side,
      )
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Done" }))
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    },
  )
})
