import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Input } from "./input"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "./field"

describe("Field components", () => {
  it("composes field set, group, orientation, label, content, and description", () => {
    render(
      <FieldSet>
        <FieldLegend>Profile</FieldLegend>
        <FieldLegend variant="label">Account details</FieldLegend>
        <FieldGroup>
          <Field aria-label="Name field" orientation="horizontal">
            <FieldLabel htmlFor="profile-name">Name</FieldLabel>
            <FieldContent>
              <FieldTitle>Public name</FieldTitle>
              <Input id="profile-name" />
              <FieldDescription>Visible to other members.</FieldDescription>
            </FieldContent>
          </Field>
          <Field aria-label="Email field" orientation="responsive">
            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
            <Input id="profile-email" />
          </Field>
        </FieldGroup>
      </FieldSet>,
    )

    expect(screen.getByRole("group", { name: "Name field" })).toHaveAttribute(
      "data-orientation",
      "horizontal",
    )
    expect(screen.getByRole("group", { name: "Email field" })).toHaveAttribute(
      "data-orientation",
      "responsive",
    )
    expect(screen.getByLabelText("Name")).toHaveAttribute("id", "profile-name")
    expect(screen.getByText("Public name")).toBeInTheDocument()
    expect(screen.getByText("Visible to other members.")).toBeInTheDocument()
    expect(screen.getByText("Profile")).toHaveAttribute("data-variant", "legend")
    expect(screen.getByText("Account details")).toHaveAttribute("data-variant", "label")
  })

  it("renders separators with and without explanatory content", () => {
    render(
      <>
        <FieldSeparator>or continue with</FieldSeparator>
        <FieldSeparator />
      </>,
    )

    expect(screen.getByText("or continue with")).toBeInTheDocument()
    expect(screen.getAllByRole("separator")).toHaveLength(2)
  })
})

describe("FieldError", () => {
  it("renders no alert when no error content exists", () => {
    const { rerender } = render(<FieldError />)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()

    rerender(<FieldError errors={[]} />)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("renders a single error and deduplicates repeated messages", () => {
    const { rerender } = render(<FieldError errors={[{ message: "Required" }]} />)
    expect(screen.getByRole("alert")).toHaveTextContent("Required")
    expect(screen.queryByRole("list")).not.toBeInTheDocument()

    rerender(<FieldError errors={[{ message: "Required" }, { message: "Required" }]} />)
    expect(screen.getByRole("alert")).toHaveTextContent("Required")
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  it("lists distinct messages and omits message-less errors", () => {
    render(
      <FieldError
        errors={[
          { message: "Required" },
          undefined,
          {},
          { message: "Invalid" },
          { message: "Required" },
        ]}
      />,
    )

    expect(screen.getByRole("list")).toHaveTextContent("RequiredInvalid")
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
  })

  it("prefers explicit children over the errors array", () => {
    render(<FieldError errors={[{ message: "Ignored" }]}>Custom message</FieldError>)

    expect(screen.getByRole("alert")).toHaveTextContent("Custom message")
    expect(screen.queryByText("Ignored")).not.toBeInTheDocument()
  })
})
