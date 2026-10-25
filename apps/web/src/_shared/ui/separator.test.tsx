import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Separator } from "./separator"

describe("Separator", () => {
  it("defaults to horizontal and supports vertical orientation", () => {
    render(
      <>
        <Separator />
        <Separator orientation="vertical" />
      </>,
    )

    expect(
      screen.getAllByRole("separator").map((item) => item.getAttribute("aria-orientation")),
    ).toEqual(["horizontal", "vertical"])
  })
})
