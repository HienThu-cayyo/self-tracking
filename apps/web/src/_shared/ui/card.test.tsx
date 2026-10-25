import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"

describe("Card", () => {
  it("composes every card slot and supports compact sizing", () => {
    render(
      <Card role="region" aria-label="Account summary" size="sm">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Current plan</CardDescription>
          <CardAction>
            <button type="button">Manage</button>
          </CardAction>
        </CardHeader>
        <CardContent>Standard</CardContent>
        <CardFooter>Renews in June</CardFooter>
      </Card>,
    )

    expect(screen.getByRole("region", { name: "Account summary" })).toHaveAttribute(
      "data-size",
      "sm",
    )
    expect(screen.getByText("Account")).toBeInTheDocument()
    expect(screen.getByText("Current plan")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Manage" })).toBeInTheDocument()
    expect(screen.getByText("Standard")).toBeInTheDocument()
    expect(screen.getByText("Renews in June")).toBeInTheDocument()
  })

  it("uses the default card size", () => {
    render(<Card role="region" aria-label="Default card" />)

    expect(screen.getByRole("region", { name: "Default card" })).toHaveAttribute(
      "data-size",
      "default",
    )
  })
})
