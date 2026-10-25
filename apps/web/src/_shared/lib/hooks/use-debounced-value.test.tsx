import { act, renderHook } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useDebouncedValue } from "./use-debounced-value"

afterEach(() => {
  vi.useRealTimers()
})

describe("useDebouncedValue", () => {
  it("returns the initial value immediately and delays later values", () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "initial" },
    })

    expect(result.current).toBe("initial")

    rerender({ value: "next" })
    expect(result.current).toBe("initial")

    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe("initial")

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe("next")
  })

  it("publishes only the latest value after rapid changes", () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "initial" },
    })

    rerender({ value: "intermediate" })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: "latest" })

    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe("initial")

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe("latest")
  })

  it("restarts the pending delay when the delay changes", () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ value, delayMs }) => useDebouncedValue(value, delayMs),
      { initialProps: { value: "initial", delayMs: 300 } },
    )

    rerender({ value: "next", delayMs: 300 })
    act(() => vi.advanceTimersByTime(100))
    rerender({ value: "next", delayMs: 500 })

    act(() => vi.advanceTimersByTime(499))
    expect(result.current).toBe("initial")

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe("next")
  })

  it("clears the pending timer when unmounted", () => {
    vi.useFakeTimers()

    const { rerender, unmount } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "initial" },
    })

    rerender({ value: "next" })
    expect(vi.getTimerCount()).toBe(1)

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("returns the initial value during server rendering", () => {
    function Snapshot() {
      return <span>{useDebouncedValue("server", 300)}</span>
    }

    expect(renderToString(<Snapshot />)).toBe("<span>server</span>")
  })
})
