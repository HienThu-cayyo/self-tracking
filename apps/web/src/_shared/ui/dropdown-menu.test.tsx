import { useState } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu"

function MenuExample({ onSelect }: { onSelect: () => void }) {
  const [checked, setChecked] = useState(false)
  const [alignment, setAlignment] = useState("left")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Open actions</DropdownMenuTrigger>
      <DropdownMenuContent align="end" alignOffset={2} side="top" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel inset>Workspace</DropdownMenuLabel>
          <DropdownMenuItem onClick={onSelect}>
            Edit project
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>Disabled action</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" inset>
            Delete project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </DropdownMenuGroup>
        <DropdownMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>
          Show toolbar
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={alignment} onValueChange={setAlignment}>
          <DropdownMenuRadioItem value="left">Align left</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="right" inset>
            Align right
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger inset>More options</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>About this project</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe("DropdownMenu", () => {
  it("renders menu items and supports selection, checkbox, radio, and submenu actions", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<MenuExample onSelect={onSelect} />)
    await user.click(screen.getByRole("button", { name: "Open actions" }))

    expect(await screen.findByRole("menuitem", { name: /Edit project/ })).toBeInTheDocument()
    expect(await screen.findByRole("menuitem", { name: "Disabled action" })).toHaveAttribute(
      "aria-disabled",
      "true",
    )
    expect(screen.getByText("Workspace")).toBeInTheDocument()
    expect(screen.getByText("⌘E")).toBeInTheDocument()

    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Show toolbar" }))
    await waitFor(() =>
      expect(screen.getByRole("menuitemcheckbox", { name: "Show toolbar" })).toHaveAttribute(
        "aria-checked",
        "true",
      ),
    )

    await user.click(await screen.findByRole("menuitemradio", { name: "Align right" }))
    await waitFor(() =>
      expect(screen.getByRole("menuitemradio", { name: "Align right" })).toHaveAttribute(
        "aria-checked",
        "true",
      ),
    )

    await user.click(await screen.findByRole("menuitem", { name: /Edit project/ }))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it("opens a nested submenu from its trigger", async () => {
    const user = userEvent.setup()

    render(<MenuExample onSelect={() => {}} />)
    await user.click(screen.getByRole("button", { name: "Open actions" }))
    await user.hover(await screen.findByRole("menuitem", { name: "More options" }))

    expect(await screen.findByRole("menuitem", { name: "About this project" })).toBeInTheDocument()
  })

  it("renders explicit portal content while the menu is open", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuPortal>
          <span>Menu portal content</span>
        </DropdownMenuPortal>
      </DropdownMenu>,
    )

    expect(screen.getByText("Menu portal content")).toBeInTheDocument()
  })
})
