import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"

describe("Dialog", () => {
  it("opens with an accessible name and closes with Escape", async () => {
    const user = userEvent.setup()

    render(
      <Dialog>
        <DialogTrigger>Open settings</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Update your preferences.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Close settings</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )

    await user.click(screen.getByRole("button", { name: "Open settings" }))
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument()
    expect(screen.getByText("Update your preferences.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument()

    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("allows a custom close action and can hide the built-in close button", async () => {
    const user = userEvent.setup()

    render(
      <Dialog>
        <DialogTrigger>Open help</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Help</DialogTitle>
          <DialogClose>Done</DialogClose>
        </DialogContent>
      </Dialog>,
    )

    await user.click(screen.getByRole("button", { name: "Open help" }))
    expect(screen.getByRole("dialog", { name: "Help" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Đóng" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Done" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })
})
