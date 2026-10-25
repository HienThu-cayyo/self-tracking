import { fireEvent, render, screen, within } from "@testing-library/react"
import type { ColumnDef } from "@tanstack/react-table"
import { describe, expect, it } from "vitest"

import { DataTable } from "./data-table"

type Person = { name: string; role: string }

const columns: ColumnDef<Person>[] = [
  {
    header: "Profile",
    columns: [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "role", header: "Role" },
    ],
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => "View",
    enableSorting: false,
  },
]

describe("DataTable", () => {
  it("renders grouped headers and sorts rows accessibly", () => {
    render(
      <DataTable
        columns={columns}
        data={[
          { name: "Zoe", role: "Admin" },
          { name: "Amy", role: "Editor" },
        ]}
      />,
    )

    const nameHeader = screen.getByRole("columnheader", { name: "Name" })
    expect(screen.getByRole("columnheader", { name: "Profile" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Actions" })).not.toHaveAttribute("aria-sort")
    expect(nameHeader).not.toHaveAttribute("aria-sort")

    fireEvent.click(screen.getByRole("button", { name: "Name" }))
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending")
    expect(
      within(screen.getByRole("table"))
        .getAllByRole("row")
        .slice(-2)
        .map((row) => within(row).getAllByRole("cell")[0]?.textContent),
    ).toEqual(["Amy", "Zoe"])

    fireEvent.click(screen.getByRole("button", { name: "Name" }))
    expect(nameHeader).toHaveAttribute("aria-sort", "descending")
  })

  it("exposes aria-sort for only one column when Shift-clicking another", () => {
    render(
      <DataTable
        columns={columns}
        data={[
          { name: "Zoe", role: "Admin" },
          { name: "Amy", role: "Editor" },
        ]}
      />,
    )

    const nameHeader = screen.getByRole("columnheader", { name: "Name" })
    const roleHeader = screen.getByRole("columnheader", { name: "Role" })

    fireEvent.click(screen.getByRole("button", { name: "Name" }))
    fireEvent.click(screen.getByRole("button", { name: "Role" }), { shiftKey: true })

    expect(nameHeader).not.toHaveAttribute("aria-sort")
    expect(roleHeader).toHaveAttribute("aria-sort", "ascending")
    expect(screen.getByRole("table").querySelectorAll("[aria-sort]")).toHaveLength(1)
  })

  it("shows a default empty message when there are no rows", () => {
    render(<DataTable columns={columns} data={[]} />)

    expect(screen.getByRole("cell", { name: "No results." })).toBeInTheDocument()
  })

  it("allows an empty message to be customized", () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No people found." />)

    expect(screen.getByRole("cell", { name: "No people found." })).toBeInTheDocument()
  })
})
