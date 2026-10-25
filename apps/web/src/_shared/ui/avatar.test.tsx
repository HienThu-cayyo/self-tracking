import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "./avatar"

describe("Avatar", () => {
  it("shows its fallback while an image is unavailable and supports sizes", () => {
    render(
      <>
        <Avatar size="sm">
          <AvatarImage src="/avatar.png" alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
          <AvatarBadge aria-label="Online status" />
        </Avatar>
        <Avatar size="default">
          <AvatarFallback>Default</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>Large</AvatarFallback>
        </Avatar>
      </>,
    )

    expect(screen.getByLabelText("Online status")).toBeInTheDocument()
    expect(screen.getByText("AL")).toBeInTheDocument()
    expect(document.querySelector('[data-size="default"]')).toBeInTheDocument()
    expect(document.querySelector('[data-size="lg"]')).toBeInTheDocument()
  })

  it("groups avatars with a member count", () => {
    render(
      <AvatarGroup role="group" aria-label="Project team">
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>,
    )

    expect(screen.getByRole("group", { name: "Project team" })).toHaveTextContent("+3")
  })
})
