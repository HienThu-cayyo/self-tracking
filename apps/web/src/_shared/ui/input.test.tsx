import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Input } from "./input"

describe("Input", () => {
  it("forwards type, placeholder, and disabled state", () => {
    render(
      <>
        <Input aria-label="Email address" type="email" placeholder="name@example.com" />
        <Input aria-label="Read only field" disabled />
      </>,
    )

    expect(screen.getByRole("textbox", { name: "Email address" })).toHaveAttribute("type", "email")
    expect(screen.getByPlaceholderText("name@example.com")).toBeEnabled()
    expect(screen.getByRole("textbox", { name: "Read only field" })).toBeDisabled()
  })
})
