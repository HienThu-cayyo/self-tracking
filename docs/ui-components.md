# UI components

Shared UI primitives live in `apps/web/src/_shared/ui`. Reuse these components before writing similar markup in a page or feature.

## Available components

`Avatar`, `Badge`, `Button`, `Calendar`, `Card`, `ChartContainer`, `ChartLegend`, `ChartLegendContent`, `ChartTooltip`, `ChartTooltipContent`, `DataTable`, `Dialog`, `DropdownMenu`, `Field`, `Input`, `Label`, `Popover`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`, `Toaster`, `Spinner`, `Table`, `ThemeProvider`, `Toggle`, `ToggleGroup`, and `Tooltip`.

The chart module also exports the `ChartConfig` type for defining chart series.

Import components directly from their modules to keep their APIs explicit:

```tsx
import { Button } from "@/_shared/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/_shared/ui/table"

export function Example() {
  return (
    <>
      <Button type="button">Save</Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Product</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  )
}
```

Dialogs can use the primitives exported from the same module:

```tsx
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/_shared/ui/dialog"
```

Use `Table` primitives for static or simple markup. Use `DataTable` for a local dataset that needs sortable columns:

```tsx
"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/_shared/ui/data-table"

type Product = { id: string; name: string }

const columns: ColumnDef<Product>[] = [{ accessorKey: "name", header: "Name" }]

export function ProductTable({ products }: { products: Product[] }) {
  return <DataTable columns={columns} data={products} />
}
```

For server-side pagination/filtering or custom table state, use TanStack Table directly and render it with the shared `Table` primitives. See the [data-fetching and tables guide](data-fetching-and-tables.md) for the choice and setup rules.

`RootLayout` mounts `AppProviders`, which includes `ThemeProvider`, `TooltipProvider`, `Toaster`, and `QueryClientProvider`. Do not mount another instance in individual pages. CSS theme tokens live in `apps/web/src/app/globals.css`; use semantic tokens instead of hardcoded colors when creating components. `cn` (`@/_shared/lib/cn`) combines Tailwind classes; `useIsMobile` lives in `@/_shared/lib/hooks/use-mobile`.

These wrappers follow shadcn component patterns and use Base UI primitives. Colocated tests cover the current shared UI modules and their runtime branches. New components should preserve keyboard interactions, accessible names, and disabled and loading states where appropriate; add behavior tests for each supported state and run the root coverage gate.
