import { render, screen } from "@testing-library/react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { QueryClient, useQueryClient } from "@tanstack/react-query"

import { AppProviders } from "./providers"

function QueryClientProbe({ clients }: { clients: QueryClient[] }) {
  const queryClient = useQueryClient()
  clients.push(queryClient)

  return <output>{String(queryClient.getDefaultOptions().queries?.staleTime)}</output>
}

describe("AppProviders", () => {
  it("keeps one query client for the browser app lifetime", () => {
    const clients: QueryClient[] = []
    const view = render(
      <AppProviders>
        <QueryClientProbe clients={clients} />
      </AppProviders>,
    )

    view.rerender(
      <AppProviders>
        <QueryClientProbe clients={clients} />
      </AppProviders>,
    )

    expect(screen.getByText("60000")).toBeInTheDocument()
    expect(clients[1]).toBe(clients[0])
  })

  it("creates a separate query client for each server render", () => {
    const clients: QueryClient[] = []
    vi.stubGlobal("window", undefined)

    try {
      renderToStaticMarkup(
        <AppProviders>
          <QueryClientProbe clients={clients} />
        </AppProviders>,
      )
      renderToStaticMarkup(
        <AppProviders>
          <QueryClientProbe clients={clients} />
        </AppProviders>,
      )
    } finally {
      vi.unstubAllGlobals()
    }

    expect(clients[1]).not.toBe(clients[0])
  })
})
