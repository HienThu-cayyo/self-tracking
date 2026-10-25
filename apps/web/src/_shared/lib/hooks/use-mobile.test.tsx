import { act, renderHook } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useIsMobile } from "./use-mobile"

function createMediaQueryList(initialWidth: number) {
  let width = initialWidth
  const listeners = new Set<EventListenerOrEventListenerObject>()
  const addEventListener = vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
    listeners.add(listener)
  })
  const removeEventListener = vi.fn(
    (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.delete(listener)
    },
  )
  const mediaQueryList = {
    media: "(max-width: 767px)",
    onchange: null,
    addEventListener,
    removeEventListener,
    dispatchEvent: vi.fn(() => true),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    matches: false,
  }
  Object.defineProperty(mediaQueryList, "matches", {
    get: () => width <= 767,
  })

  return {
    mediaQueryList: mediaQueryList as unknown as MediaQueryList,
    addEventListener,
    removeEventListener,
    setWidth(nextWidth: number) {
      width = nextWidth
      const event = new Event("change") as MediaQueryListEvent
      for (const listener of listeners) {
        if (typeof listener === "function") listener(event)
        else listener.handleEvent(event)
      }
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useIsMobile", () => {
  it("updates at the 768px breakpoint and removes its listener", () => {
    const media = createMediaQueryList(767)
    const matchMedia = vi.fn(() => media.mediaQueryList)
    vi.stubGlobal("matchMedia", matchMedia)

    const { result, unmount } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
    expect(matchMedia).toHaveBeenCalledWith("(max-width: 767px)")

    act(() => media.setWidth(768))
    expect(result.current).toBe(false)

    unmount()
    expect(media.addEventListener).toHaveBeenCalledWith("change", expect.any(Function))
    expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function))
  })

  it("uses the desktop snapshot at 768px", () => {
    const media = createMediaQueryList(768)
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => media.mediaQueryList),
    )

    expect(renderHook(() => useIsMobile()).result.current).toBe(false)
  })

  it("returns false in a server-rendered snapshot", () => {
    function Snapshot() {
      return <span>{String(useIsMobile())}</span>
    }

    expect(renderToString(<Snapshot />)).toBe("<span>false</span>")
  })
})
