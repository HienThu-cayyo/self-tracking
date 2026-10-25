# Data Fetching and Tables

This guide explains when to use Next.js server-side data loading, `fetchJson`, TanStack Query, the shared shadcn-style `Table`, and TanStack Table.

## Current starter defaults

The web workspace includes TanStack Query and TanStack Table v8. `AppProviders` at `apps/web/src/_app/providers.tsx` mounts the shared QueryClient and existing UI providers from the root layout. `DataTable` at `apps/web/src/_shared/ui/data-table.tsx` is a sortable, client-side table built with TanStack Table and the shared shadcn-style primitives in `table.tsx`.

## Choose the smallest tool that fits

| Need                                                                                                                                    | Use                                                                                                          | Why                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Load data for a server-rendered page with no client refresh or shared cache requirement                                                 | A Next.js Server Component and the owning server-side entity/repository; use `fetchJson` for JSON HTTP calls | Keeps initial data loading on the server without adding a client cache                 |
| Make a one-off client request or submit an action without shared caching, automatic refetching, or optimistic updates                   | `fetchJson` plus local React state                                                                           | The existing helper validates JSON responses and handles request errors                |
| Share remote data between client components, keep it fresh, refetch it, or coordinate it with mutations, polling, or optimistic updates | TanStack Query                                                                                               | It manages client-side server state, caching, and synchronization                      |
| Display a simple table with no sorting, filtering, pagination, selection, or column controls                                            | The shared shadcn-style `Table` primitives                                                                   | They provide semantic table markup and styling without a table-state engine            |
| Display a local dataset with sortable columns                                                                                           | The shared `DataTable` component                                                                             | It provides common client-side sorting and rendering through existing UI primitives    |
| Build a table with server-side filtering or pagination, row selection, column visibility, or custom state                               | TanStack Table directly, rendered with the shared `Table` primitives                                         | TanStack Table manages table state and row models; the shared primitives render the UI |

TanStack Query and TanStack Table solve different problems. Query owns client-side remote data state; Table owns table state and row processing. They can be used independently or together.

## Data-fetching rules

- Prefer server-side loading for data needed to render a page when the client does not need Query's cache and synchronization behavior.
- Use `fetchJson` for JSON HTTP requests and pass a Zod schema. For PostgreSQL data, call the owning server-side entity/repository instead of making the browser connect to the database.
- Use TanStack Query only for client-managed remote data. Do not use it for form values, toggles, modal state, or other local UI state.
- Keep query keys, query functions, schemas, and mutations with the feature or entity that owns the data. Put them in `_entities/<domain>/` when reused across features; keep them in `_features/<workflow>/` when they serve one workflow. Do not move product-specific queries into `_shared`.
- Include every input that changes the result in the query key, such as search text, filters, sort order, and page. Invalidate the narrowest affected key after a successful mutation.
- Keep credentials, database access, and provider API calls on the server. A client query should call an authorized application route when it needs protected data.

### Where Query is provided

TanStack Query is already declared in `apps/web/package.json`; do not add a second provider in a page or feature. `AppProviders` is the single app-level provider and `apps/web/src/app/layout.tsx` mounts it around the route tree. The provider creates one stable QueryClient in the browser, a new client for each server render, and sets a one-minute default query `staleTime`.

Use it for client-side server state only. Keep queries and mutations in the owning entity or feature; a reusable entity query belongs under `_entities/<domain>/`, while a workflow-only query belongs under `_features/<workflow>/`. If server prefetching, dehydration, or Suspense queries are introduced, follow TanStack Query's Next.js SSR guide before changing the provider lifecycle.

### Debounce rapidly changing query inputs

For search or filter inputs that would otherwise change a query key on every keystroke, keep the input responsive and debounce only the value passed to the query. `useDebouncedValue` is a shared timer utility; the owning feature or entity still defines the query key and request:

```tsx
"use client"

import { useState } from "react"

import { useDebouncedValue } from "@/_shared/lib/hooks/use-debounced-value"

function ProductSearch() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const products = useProductList({ page: 1, search: debouncedSearch })

  return <input value={search} onChange={(event) => setSearch(event.target.value)} />
}
```

Use `search` for the input value so typing updates immediately. Use the debounced value only for the query or other expensive downstream work. Do not put network requests or product-specific query logic inside the shared hook.

Place reusable entity queries in a domain-owned module such as `apps/web/src/_entities/<domain>/api/queries.ts`. Place queries used by one workflow in that feature's API module. Keep response schemas near the entity contract and reuse `fetchJson` in query functions:

```ts
"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchJson } from "@/_shared/api/fetch-json"
import { ProductListSchema } from "../model/product-schema"

type ProductFilters = { page: number; search: string }

export const productKeys = {
  all: ["products"] as const,
  list: (filters: ProductFilters) => ["products", "list", filters] as const,
}

export function useProductList(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({
        page: String(filters.page),
        search: filters.search,
      })

      return fetchJson({
        url: `/api/products?${params}`,
        schema: ProductListSchema,
        errorMessage: "Unable to load products",
        signal,
      })
    },
  })
}
```

This is an illustrative product example; the starter does not include a product entity or route. For writes, define a mutation function beside the owning API operation and invalidate the affected query key in `onSuccess`. Add optimistic updates only when the interaction needs them and test both update and rollback behavior.

## Choose and render a table

Use the shared `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, and `TableCell` directly for static or simple data. Keep loading, empty, and error states in the page, widget, or feature that owns the workflow.

For a local dataset with sortable columns, use the shared `DataTable`. Define its columns in the client module that owns the table. Column definitions may contain render callbacks, so do not pass them from a Server Component across the client boundary:

```tsx
"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/_shared/ui/data-table"

type Person = { name: string; role: string }

const columns: ColumnDef<Person>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
]

export function PeopleTable({ people }: { people: Person[] }) {
  return <DataTable columns={columns} data={people} />
}
```

The starter declares TanStack Table in the web workspace already. `DataTable` handles local sorting and the empty state. For more advanced or server-managed behavior, build a feature-owned table with TanStack Table directly and render it using the shared `Table` primitives. TanStack Table is headless, so custom implementations render its header groups and cells with the shared primitives:

```tsx
"use client"

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { useState } from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/_shared/ui/table"

type Product = { id: string; name: string }

export function ProductTable({
  rows,
  columns,
}: {
  rows: Product[]
  columns: ColumnDef<Product>[]
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead
                key={header.id}
                aria-sort={
                  header.column.getIsSorted() === "asc"
                    ? "ascending"
                    : header.column.getIsSorted() === "desc"
                      ? "descending"
                      : undefined
                }
              >
                {header.isPlaceholder ? null : header.column.getCanSort() ? (
                  <button type="button" onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </button>
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length}>No products found.</TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
```

Add only the row models and controlled state for interactions the feature actually needs, such as `getSortedRowModel` with sorting state or `getFilteredRowModel` with filter state. Use keyboard-accessible controls in headers and preserve sort state in `aria-sort`. Do not add a table engine solely to render cells.

### Server-side tables

For a dataset small enough to load completely, TanStack Table can sort and paginate it in the browser. For large or permission-filtered datasets, keep filtering, sorting, and pagination on the server:

1. Keep table state (page, sort, and filters) in the owning feature; use URL search parameters when the state should be shareable or survive refreshes.
2. Include that state in the TanStack Query key and send it to the API route.
3. Configure TanStack Table with the relevant `manualPagination`, `manualSorting`, or `manualFiltering` options and pass the server's `rowCount`.
4. Render the rows returned by the server. Manual mode tells TanStack Table to skip that client-side row model; it does not fetch or process data on the server.

Use TanStack Query with TanStack Table when the interactive server-backed table benefits from client caching, refetching, or mutation invalidation. A server-rendered table does not need TanStack Query just because it uses TanStack Table.

## Official references

- [React: Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [TanStack Query: Quick Start](https://tanstack.com/query/latest/docs/framework/react/quick-start)
- [TanStack Query: Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [TanStack Query: Advanced Server Rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [TanStack Table v8: Introduction](https://tanstack.com/table/v8/docs/introduction)
- [TanStack Table v8: Pagination](https://tanstack.com/table/v8/docs/guide/pagination)
- [TanStack Table v8: Sorting](https://tanstack.com/table/v8/docs/guide/sorting)
