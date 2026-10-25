import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Input } from "./input"
import { Label } from "./label"

describe("Label", () => {
  it("associates its accessible name with the input", () => {
    render(
      <>
        <Label htmlFor="account-name">Account name</Label>
        <Input id="account-name" />
      </>,
    )

    expect(screen.getByLabelText("Account name")).toHaveAttribute("id", "account-name")
  })
})
