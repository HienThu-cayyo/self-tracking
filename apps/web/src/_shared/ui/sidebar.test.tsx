import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./sidebar"

function setupMatchMedia(initialMatch = false) {
  let matches = initialMatch
  const listeners = new Set<EventListenerOrEventListenerObject>()
  const mediaQuery = {
    media: "(max-width: 767px)",
    onchange: null,
    get matches() {
      return matches
    },
    addEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.add(listener)
    }),
    removeEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.delete(listener)
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  }
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mediaQuery),
  )

  return {
    mediaQuery,
    setMatches(nextMatch: boolean) {
      matches = nextMatch
      const event = new Event("change") as MediaQueryListEvent
      for (const listener of listeners) {
        if (typeof listener === "function") listener(event)
        else listener.handleEvent(event)
      }
    },
  }
}

function SidebarContextControls() {
  const { open, setOpen, setSidebarWidth } = useSidebar()

  return (
    <div>
      <span>Context open: {String(open)}</span>
      <button onClick={() => setOpen(false)}>Close directly</button>
      <button onClick={() => setSidebarWidth((width) => width + 10)}>Grow directly</button>
    </div>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.cookie = "sidebar_state=; path=/; max-age=0"
})

describe("useSidebar and SidebarProvider", () => {
  it("throws when the sidebar context is missing", () => {
    function ContextConsumer() {
      useSidebar()
      return null
    }

    expect(() => render(<ContextConsumer />)).toThrow(
      "useSidebar must be used within a SidebarProvider.",
    )
  })

  it("updates uncontrolled state, cookie, and keyboard shortcuts", async () => {
    setupMatchMedia()
    const user = userEvent.setup()
    const onTriggerClick = vi.fn()
    render(
      <SidebarProvider>
        <SidebarTrigger onClick={onTriggerClick} />
        <Sidebar>
          <SidebarHeader>Navigation</SidebarHeader>
        </Sidebar>
      </SidebarProvider>,
    )

    const sidebar = screen.getByText("Navigation").closest('[data-slot="sidebar"]')
    expect(sidebar).toHaveAttribute("data-state", "expanded")

    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }))
    expect(sidebar).toHaveAttribute("data-state", "collapsed")
    expect(document.cookie).toContain("sidebar_state=false")
    expect(onTriggerClick).toHaveBeenCalledOnce()

    fireEvent.keyDown(window, { key: "b", ctrlKey: true })
    expect(sidebar).toHaveAttribute("data-state", "expanded")
    fireEvent.keyDown(window, { key: "b", metaKey: true })
    expect(sidebar).toHaveAttribute("data-state", "collapsed")
    fireEvent.keyDown(window, { key: "b" })
    expect(sidebar).toHaveAttribute("data-state", "collapsed")
  })

  it.each([true, false])(
    "sets a controlled %s value without changing the parent's value",
    async (controlledOpen) => {
      setupMatchMedia()
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      render(
        <SidebarProvider open={controlledOpen} onOpenChange={onOpenChange}>
          <SidebarTrigger />
          <Sidebar />
        </SidebarProvider>,
      )

      await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }))
      expect(onOpenChange).toHaveBeenCalledWith(!controlledOpen)
      expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
        "data-state",
        controlledOpen ? "expanded" : "collapsed",
      )
    },
  )

  it("accepts direct context setters for open state and width", async () => {
    setupMatchMedia()
    const user = userEvent.setup()
    render(
      <SidebarProvider>
        <SidebarContextControls />
        <Sidebar />
      </SidebarProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Close directly" }))
    expect(screen.getByText("Context open: false")).toBeInTheDocument()
    expect(document.cookie).toContain("sidebar_state=false")
    await user.click(screen.getByRole("button", { name: "Grow directly" }))
    expect(document.querySelector('[data-slot="sidebar-wrapper"]')).toHaveStyle(
      "--sidebar-width: 240px",
    )
  })

  it("renders the non-collapsible sidebar before mobile and desktop branches", () => {
    setupMatchMedia(true)
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">Always visible</Sidebar>
      </SidebarProvider>,
    )

    expect(screen.getByText("Always visible").closest('[data-slot="sidebar"]')).toBeInTheDocument()
  })

  it("opens and closes the mobile sheet through the sidebar trigger", async () => {
    setupMatchMedia(true)
    const user = userEvent.setup()
    render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar side="right" dir="rtl">
          Mobile navigation
        </Sidebar>
      </SidebarProvider>,
    )

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }))
    const dialog = screen.getByRole("dialog", { name: "Sidebar" })
    expect(dialog).toHaveAttribute("data-mobile", "true")
    expect(dialog).toHaveAttribute("dir", "rtl")
    expect(dialog).toHaveStyle("--sidebar-width: 18rem")

    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it.each([
    ["sidebar", "left", "offcanvas"],
    ["floating", "right", "icon"],
    ["inset", "left", "icon"],
  ] as const)(
    "renders desktop %s variant on the %s side with %s collapse",
    (variant, side, collapsible) => {
      setupMatchMedia(false)
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar
            variant={variant}
            side={side}
            collapsible={collapsible}
            aria-label="Workspace sidebar"
          >
            Workspace
          </Sidebar>
        </SidebarProvider>,
      )

      const sidebarContainer = screen.getByLabelText("Workspace sidebar")
      const sidebar = sidebarContainer.closest('[data-slot="sidebar"]')!
      expect(sidebar).toHaveAttribute("data-variant", variant)
      expect(sidebar).toHaveAttribute("data-side", side)
      expect(sidebar).toHaveAttribute("data-collapsible", collapsible)
      expect(sidebar.querySelector('[data-slot="sidebar-gap"]')).toBeInTheDocument()
      expect(sidebar.querySelector('[data-slot="sidebar-container"]')).toBeInTheDocument()
    },
  )
})

describe("SidebarRail", () => {
  it("resizes by keyboard, clamps widths, and reverses arrows on the right side", async () => {
    setupMatchMedia()
    const user = userEvent.setup()
    render(
      <SidebarProvider>
        <Sidebar side="right">
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>,
    )
    const rail = screen.getByRole("separator", { name: "Thay đổi độ rộng thanh bên" })
    const wrapper = rail.closest('[data-slot="sidebar-wrapper"]')!

    await user.click(rail)
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "230")
    await user.keyboard("{ArrowRight}")
    expect(rail).toHaveAttribute("aria-valuenow", "222")
    await user.keyboard("{ArrowLeft}")
    expect(rail).toHaveAttribute("aria-valuenow", "230")
    await user.keyboard("{Home}")
    expect(rail).toHaveAttribute("aria-valuenow", "192")
    await user.keyboard("{ArrowRight}")
    expect(rail).toHaveAttribute("aria-valuenow", "192")
    await user.keyboard("{ArrowLeft}")
    expect(rail).toHaveAttribute("aria-valuenow", "200")
    await user.keyboard("{End}")
    expect(rail).toHaveAttribute("aria-valuenow", "384")
    await user.keyboard("{ArrowLeft}")
    expect(rail).toHaveAttribute("aria-valuenow", "384")
    expect(wrapper).toHaveStyle("--sidebar-width: 384px")
    fireEvent.keyDown(rail, { key: "Escape" })
    expect(rail).toHaveAttribute("aria-valuenow", "384")
  })

  it("uses left-side keyboard direction and keeps the minimum width clamped", () => {
    setupMatchMedia()
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>,
    )
    const rail = screen.getByRole("separator", { name: "Thay đổi độ rộng thanh bên" })

    fireEvent.keyDown(rail, { key: "ArrowRight" })
    expect(rail).toHaveAttribute("aria-valuenow", "238")
    fireEvent.keyDown(rail, { key: "ArrowLeft" })
    expect(rail).toHaveAttribute("aria-valuenow", "230")
    fireEvent.keyDown(rail, { key: "Home" })
    fireEvent.keyDown(rail, { key: "ArrowLeft" })
    expect(rail).toHaveAttribute("aria-valuenow", "192")
  })

  it("ignores prevented and non-primary pointer input, then resizes and suppresses the drag click", () => {
    setupMatchMedia()
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>,
    )
    const rail = screen.getByRole("separator", { name: "Thay đổi độ rộng thanh bên" })
    const wrapper = rail.closest('[data-slot="sidebar-wrapper"]')!

    fireEvent.pointerDown(rail, { button: 2, pointerId: 4, clientX: 20 })
    fireEvent.pointerMove(rail, { pointerId: 4, clientX: 80 })
    expect(rail).toHaveAttribute("aria-valuenow", "230")

    fireEvent.pointerDown(rail, { button: 0, pointerId: 4, clientX: 20 })
    fireEvent.pointerMove(rail, { pointerId: 9, clientX: 80 })
    expect(rail).toHaveAttribute("aria-valuenow", "230")
    fireEvent.pointerMove(rail, { pointerId: 4, clientX: 22 })
    expect(wrapper).toHaveAttribute("data-resizing", "false")
    fireEvent.pointerMove(rail, { pointerId: 4, clientX: 40 })
    expect(rail).toHaveAttribute("aria-valuenow", "250")
    expect(wrapper).toHaveAttribute("data-resizing", "true")
    fireEvent.pointerMove(rail, { pointerId: 4, clientX: 42 })
    expect(rail).toHaveAttribute("aria-valuenow", "252")
    const releasePointerCapture = vi.fn()
    Object.defineProperty(rail, "hasPointerCapture", { configurable: true, value: () => true })
    Object.defineProperty(rail, "releasePointerCapture", {
      configurable: true,
      value: releasePointerCapture,
    })
    fireEvent.pointerUp(rail, { pointerId: 4, clientX: 40 })
    expect(wrapper).toHaveAttribute("data-resizing", "false")
    expect(releasePointerCapture).toHaveBeenCalledWith(4)

    fireEvent.click(rail)
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
      "data-state",
      "expanded",
    )
    fireEvent.click(rail)
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
      "data-state",
      "collapsed",
    )
  })

  it("handles pointer cancellation, right-side drag direction, callback prevention, and wrong pointer ids", () => {
    setupMatchMedia()
    render(
      <SidebarProvider>
        <Sidebar side="right">
          <SidebarRail onPointerMove={(event) => event.preventDefault()} />
        </Sidebar>
      </SidebarProvider>,
    )
    const rail = screen.getByRole("separator", { name: "Thay đổi độ rộng thanh bên" })
    const wrapper = rail.closest('[data-slot="sidebar-wrapper"]')!

    fireEvent.pointerDown(rail, { button: 0, pointerId: 1, clientX: 50 })
    fireEvent.pointerMove(rail, { pointerId: 1, clientX: 30 })
    expect(rail).toHaveAttribute("aria-valuenow", "230")
    fireEvent.pointerCancel(rail, { pointerId: 2 })
    expect(wrapper).toHaveAttribute("data-resizing", "false")
    fireEvent.pointerCancel(rail, { pointerId: 1 })
    expect(wrapper).toHaveAttribute("data-resizing", "false")
    fireEvent.click(rail)
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
      "data-state",
      "collapsed",
    )
  })

  it("resizes a right sidebar in the opposite pointer direction and cancels without suppressing clicks", () => {
    setupMatchMedia()
    render(
      <SidebarProvider>
        <Sidebar side="right">
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>,
    )
    const rail = screen.getByRole("separator", { name: "Thay đổi độ rộng thanh bên" })
    const wrapper = rail.closest('[data-slot="sidebar-wrapper"]')!

    fireEvent.pointerDown(rail, { button: 0, pointerId: 7, clientX: 50 })
    fireEvent.pointerMove(rail, { pointerId: 7, clientX: 30 })
    expect(rail).toHaveAttribute("aria-valuenow", "250")
    expect(wrapper).toHaveAttribute("data-resizing", "true")
    fireEvent.pointerCancel(rail, { pointerId: 7 })
    expect(wrapper).toHaveAttribute("data-resizing", "false")
    fireEvent.click(rail)
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
      "data-state",
      "collapsed",
    )
  })

  it("does not toggle after a prevented key or click handler", () => {
    setupMatchMedia()
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarRail
            onClick={(event) => event.preventDefault()}
            onKeyDown={(event) => event.preventDefault()}
            onPointerDown={(event) => event.preventDefault()}
          />
        </Sidebar>
      </SidebarProvider>,
    )
    const rail = screen.getByRole("separator", { name: "Thay đổi độ rộng thanh bên" })

    fireEvent.click(rail)
    fireEvent.keyDown(rail, { key: "End" })
    fireEvent.pointerDown(rail, { button: 0, pointerId: 3, clientX: 0 })
    fireEvent.pointerMove(rail, { pointerId: 3, clientX: 30 })
    expect(rail).toHaveAttribute("aria-valuenow", "230")
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
      "data-state",
      "expanded",
    )
  })
})

describe("Sidebar structural components", () => {
  it("renders every exported structural component and forwards variants and attributes", async () => {
    setupMatchMedia()
    const user = userEvent.setup()
    render(
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="none">
          <SidebarHeader>Header</SidebarHeader>
          <SidebarInput aria-label="Search navigation" />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel render={<h2 />}>Projects</SidebarGroupLabel>
              <SidebarGroupAction render={<button aria-label="Add project" />} />
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive variant="outline" size="lg">
                      Dashboard
                    </SidebarMenuButton>
                    <SidebarMenuAction showOnHover aria-label="Dashboard actions">
                      Actions
                    </SidebarMenuAction>
                    <SidebarMenuAction aria-label="Always available actions" />
                    <SidebarMenuBadge>4</SidebarMenuBadge>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="/reports" size="sm" isActive>
                          Reports
                        </SidebarMenuSubButton>
                        <SidebarMenuSubButton href="/settings">Settings</SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter>Footer</SidebarFooter>
        </Sidebar>
        <SidebarInset>Main content</SidebarInset>
      </SidebarProvider>,
    )

    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add project" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Dashboard" })).toHaveAttribute("data-active", "")
    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute("data-size", "sm")
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("Header")).toBeInTheDocument()
    expect(screen.getByText("Footer")).toBeInTheDocument()
    expect(screen.getByText("Main content").closest("main")).toHaveAttribute(
      "data-slot",
      "sidebar-inset",
    )
    expect(document.querySelector('[data-sidebar="menu-skeleton-icon"]')).toBeInTheDocument()
    expect(
      document.querySelector('[data-sidebar="menu-skeleton-text"]')?.getAttribute("style"),
    ).toMatch(/--skeleton-width: \d+%/)
    await user.type(screen.getByRole("textbox", { name: "Search navigation" }), "team")
    expect(screen.getByRole("textbox", { name: "Search navigation" })).toHaveValue("team")
  })

  it("supports default skeletons, menu links, object and string tooltips", async () => {
    setupMatchMedia()
    const user = userEvent.setup()
    render(
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="none">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<a href="/home" />} tooltip="Home tooltip">
                Home
              </SidebarMenuButton>
              <SidebarMenuButton
                tooltip={{ children: "Custom tooltip", side: "left", align: "start" }}
              >
                Custom
              </SidebarMenuButton>
              <SidebarMenuSkeleton />
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>,
    )

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home")
    expect(document.querySelector('[data-sidebar="menu-skeleton-icon"]')).toBeNull()
    expect(document.querySelector('[data-sidebar="menu-skeleton-text"]')).toBeInTheDocument()
    await user.hover(screen.getByRole("link", { name: "Home" }))
    expect(await screen.findByText("Home tooltip")).toBeInTheDocument()
    await user.hover(screen.getByRole("button", { name: "Custom" }))
    expect(await screen.findByText("Custom tooltip")).toBeInTheDocument()
  })
})
