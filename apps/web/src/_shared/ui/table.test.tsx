import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

describe("Table", () => {
  it("renders semantic table headers and cells", () => {
    render(
      <Table>
        <TableCaption>Project members</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Lan</TableCell>
            <TableCell>Editor</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>2 members</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    )

    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getByRole("caption", { name: "Project members" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: "Editor" })).toBeInTheDocument()
    expect(screen.getByText("2 members")).toBeInTheDocument()
  })
})
