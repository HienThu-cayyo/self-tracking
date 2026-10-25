import { describe, expect, it, vi } from "vitest"

import { fetchJson } from "./fetch-json"

const schema = {
  parse(input: unknown) {
    if (
      typeof input !== "object" ||
      input === null ||
      !("id" in input) ||
      typeof input.id !== "number"
    ) {
      throw new Error("Invalid response")
    }
    return { id: input.id }
  },
}

describe("fetchJson", () => {
  it("returns a schema-checked JSON response", async () => {
    const result = await fetchJson({
      url: "/api/items/1",
      schema,
      errorMessage: "Could not load item",
      fetchImpl: vi.fn(async () => Response.json({ id: 1 })),
    })

    expect(result).toEqual({ id: 1 })
  })

  it("sends a JSON request body and content type", async () => {
    let requestInit: RequestInit | undefined
    const fetchImpl: typeof fetch = async (_input, init) => {
      requestInit = init
      return Response.json({ id: 2 })
    }

    await fetchJson({
      url: "/api/items",
      schema,
      errorMessage: "Could not save item",
      method: "POST",
      body: { name: "Example" },
      fetchImpl,
    })

    expect(requestInit?.body).toBe(JSON.stringify({ name: "Example" }))
    expect(requestInit?.headers).toEqual({
      accept: "application/json",
      "content-type": "application/json",
    })
  })

  it("uses GET without a body and forwards a cache policy", async () => {
    let requestInit: RequestInit | undefined
    const fetchImpl: typeof fetch = async (_input, init) => {
      requestInit = init
      return Response.json({ id: 5 })
    }

    await fetchJson({
      url: "/api/items",
      schema,
      errorMessage: "Could not load items",
      cache: "no-store",
      fetchImpl,
    })

    expect(requestInit).toMatchObject({
      method: "GET",
      cache: "no-store",
      headers: { accept: "application/json" },
    })
    expect(requestInit?.body).toBeUndefined()
  })

  it("sends PUT requests with a JSON body", async () => {
    let requestInit: RequestInit | undefined
    const fetchImpl: typeof fetch = async (_input, init) => {
      requestInit = init
      return Response.json({ id: 6 })
    }

    await fetchJson({
      url: "/api/items/6",
      schema,
      errorMessage: "Could not update item",
      method: "PUT",
      body: { name: "Updated" },
      fetchImpl,
    })

    expect(requestInit).toMatchObject({
      method: "PUT",
      body: JSON.stringify({ name: "Updated" }),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
    })
  })

  it("rejects a non-OK response with the caller's safe message", async () => {
    await expect(
      fetchJson({
        url: "/api/items",
        schema,
        errorMessage: "Could not load item",
        fetchImpl: vi.fn(async () => Response.json({ secret: "provider detail" }, { status: 502 })),
      }),
    ).rejects.toThrow("Could not load item")
  })

  it("allows a caller-approved non-OK response", async () => {
    const result = await fetchJson({
      url: "/api/items",
      schema,
      errorMessage: "Could not load item",
      fetchImpl: vi.fn(async () => Response.json({ id: 3 }, { status: 409 })),
      acceptResponse: (response) => response.status === 409,
    })

    expect(result).toEqual({ id: 3 })
  })

  it("hides invalid JSON response details behind the safe message", async () => {
    await expect(
      fetchJson({
        url: "/api/items",
        schema,
        errorMessage: "Could not load item",
        fetchImpl: vi.fn(async () => new Response("private provider detail")),
      }),
    ).rejects.toThrow("Could not load item")
  })

  it("hides schema validation details behind the safe message", async () => {
    await expect(
      fetchJson({
        url: "/api/items",
        schema,
        errorMessage: "Could not load item",
        fetchImpl: vi.fn(async () => Response.json({ id: "private provider detail" })),
      }),
    ).rejects.toThrow("Could not load item")
  })

  it("propagates caller cancellation to fetch", async () => {
    const controller = new AbortController()
    const fetchImpl: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true })
      })

    const pending = fetchJson({
      url: "/api/items",
      schema,
      errorMessage: "Could not load item",
      fetchImpl,
      signal: controller.signal,
    })
    controller.abort(new DOMException("Canceled", "AbortError"))

    await expect(pending).rejects.toMatchObject({ name: "AbortError" })
  })

  it("combines the caller signal with the timeout signal", async () => {
    const callerSignal = new AbortController().signal
    const timeoutSignal = new AbortController().signal
    const combinedSignal = new AbortController().signal
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeoutSignal)
    const any = vi.spyOn(AbortSignal, "any").mockReturnValue(combinedSignal)
    const fetchImpl: typeof fetch = async (_input, init) => {
      expect(init?.signal).toBe(combinedSignal)
      return Response.json({ id: 7 })
    }

    await fetchJson({
      url: "/api/items",
      schema,
      errorMessage: "Could not load items",
      signal: callerSignal,
      fetchImpl,
    })

    expect(timeout).toHaveBeenCalledWith(5_000)
    expect(any).toHaveBeenCalledWith([callerSignal, timeoutSignal])
  })

  it("preserves transport errors from fetch", async () => {
    const networkError = new TypeError("Network unavailable")

    await expect(
      fetchJson({
        url: "/api/items",
        schema,
        errorMessage: "Could not load items",
        fetchImpl: vi.fn().mockRejectedValue(networkError),
      }),
    ).rejects.toBe(networkError)
  })

  it("uses a 5-second timeout by default", async () => {
    const timeoutSignal = new AbortController().signal
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeoutSignal)
    const fetchImpl: typeof fetch = async (_input, init) => {
      expect(init?.signal).toBe(timeoutSignal)
      return Response.json({ id: 4 })
    }

    await fetchJson({
      url: "/api/items",
      schema,
      errorMessage: "Could not load item",
      fetchImpl,
    })

    expect(timeout).toHaveBeenCalledWith(5_000)
  })
})
