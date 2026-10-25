import type { ComponentProps, ComponentType, ReactNode, SVGProps } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ChartContainer, ChartLegendContent, ChartTooltipContent, type ChartConfig } from "./chart"

function SeriesIcon(props: SVGProps<SVGSVGElement>) {
  return <svg aria-label="Series icon" {...props} />
}

const config: ChartConfig = {
  sales: { label: "Sales", color: "#ff0000", icon: SeriesIcon as ComponentType },
  profit: { label: "Profit", theme: { light: "#00ff00", dark: "#008800" } },
  partial: { label: "Partial", theme: { light: "#ffaa00", dark: "" } },
}

type TooltipEntry = NonNullable<ComponentProps<typeof ChartTooltipContent>["payload"]>[number]

function entry(props: Record<string, unknown> = {}) {
  return {
    dataKey: "sales",
    name: "sales",
    value: 1234,
    color: "#111111",
    payload: { fill: "#222222" },
    ...props,
  } as unknown as TooltipEntry
}

function withChart(children: ReactNode, chartConfig = config) {
  return render(
    <ChartContainer id="revenue" config={chartConfig}>
      <div>{children}</div>
    </ChartContainer>,
  )
}

describe("ChartContainer", () => {
  it("renders a stable chart id and generated light and dark theme styles", () => {
    const { container } = withChart(<span>Plot</span>)
    const chart = container.querySelector('[data-slot="chart"]')

    expect(chart).toHaveAttribute("data-chart", "chart-revenue")
    expect(container.querySelector("style")).toHaveTextContent("--color-sales: #ff0000")
    expect(container.querySelector("style")).toHaveTextContent(".dark [data-chart=chart-revenue]")
    expect(container.querySelector("style")).toHaveTextContent("--color-profit: #008800")
    expect(container.querySelector("style")?.textContent?.match(/--color-partial/g)).toHaveLength(1)
  })

  it("omits generated styles when the config has no colors and supports generated ids", () => {
    const { container } = render(
      <ChartContainer
        config={{ empty: { label: "Empty", color: "" } }}
        initialDimension={{ width: 640, height: 360 }}
      >
        <span>Empty plot</span>
      </ChartContainer>,
    )

    expect(container.querySelector('[data-slot="chart"]')).toHaveAttribute(
      "data-chart",
      expect.stringMatching(/^chart-/),
    )
    expect(container.querySelector("style")).toBeNull()
    expect(screen.getByText("Empty plot")).toBeInTheDocument()
  })
})

describe("ChartTooltipContent", () => {
  it("requires chart context and hides inactive or empty tooltips", () => {
    expect(() => render(<ChartTooltipContent active payload={[entry()]} />)).toThrow(
      "useChart must be used within a <ChartContainer />",
    )

    withChart(<ChartTooltipContent active={false} payload={[entry()]} />)
    expect(screen.queryByText("1,234")).not.toBeInTheDocument()

    withChart(<ChartTooltipContent active payload={[]} />)
    expect(screen.queryByText("Sales")).not.toBeInTheDocument()
  })

  it("renders labels, icons, numeric values, configured colors, and formatter output", () => {
    withChart(
      <ChartTooltipContent
        active
        label="sales"
        payload={[entry()]}
        formatter={(value) => <strong>Formatted {value}</strong>}
      />,
    )

    expect(screen.getByText("Sales")).toBeInTheDocument()
    expect(screen.getByText("Formatted 1234")).toBeInTheDocument()
    expect(screen.queryByLabelText("Series icon")).not.toBeInTheDocument()
  })

  it("uses nested payload keys, label formatters, and the dashed nested label layout", () => {
    const labelFormatter = vi.fn((value) => `Label: ${String(value)}`)
    withChart(
      <ChartTooltipContent
        active
        labelKey="metric"
        nameKey="metric"
        labelFormatter={labelFormatter}
        indicator="dashed"
        payload={[
          entry({
            dataKey: "other",
            name: "profit",
            value: "12",
            payload: { metric: "profit", fill: "#abcdef" },
          }),
        ]}
      />,
    )

    expect(labelFormatter).toHaveBeenCalledWith(config.profit.label, expect.any(Array))
    expect(screen.getByText("Label: Profit")).toBeInTheDocument()
    expect(screen.getByText("Profit")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
  })

  it("resolves a direct payload key and falls back to the raw unknown label", () => {
    withChart(
      <ChartTooltipContent
        active
        label="missing-label"
        nameKey="metric"
        payload={[entry({ metric: "profit", dataKey: undefined, name: "sales", value: 42 })]}
      />,
    )

    expect(screen.getByText("missing-label")).toBeInTheDocument()
    expect(screen.getByText("Profit")).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("uses the generic key when a payload item has no name or data key", () => {
    withChart(
      <ChartTooltipContent
        active
        payload={[entry({ dataKey: undefined, name: undefined, value: 9, payload: null })]}
      />,
      {},
    )

    expect(screen.getByText("9")).toBeInTheDocument()
  })

  it("supports hidden labels and indicators, absent values, and non-string label fallbacks", () => {
    withChart(
      <ChartTooltipContent
        active
        hideLabel
        hideIndicator
        label={{ content: "ignored" } as unknown as string}
        payload={[
          entry({
            dataKey: "unknown",
            name: undefined,
            value: undefined,
            color: "#333333",
            payload: {},
          }),
        ]}
      />,
      {},
    )

    expect(screen.queryByText("Sales")).not.toBeInTheDocument()
    expect(screen.queryByText("1234")).not.toBeInTheDocument()
    expect(document.querySelector('[style*="--color-bg"]')).toBeNull()
  })

  it("handles missing labels, no item names, null values, and none-type entries", () => {
    withChart(
      <ChartTooltipContent
        active
        indicator="line"
        payload={[
          entry({ dataKey: "unknown", name: "unknown", value: null, payload: {} }),
          entry({ type: "none", name: "Hidden", value: 5 }),
          entry({ dataKey: undefined, name: undefined, value: 8, payload: null }),
          "malformed" as unknown as TooltipEntry,
        ]}
      />,
    )

    expect(screen.queryByText("Hidden")).not.toBeInTheDocument()
    expect(screen.queryByText("1234")).not.toBeInTheDocument()
    expect(document.querySelector('[style*="--color-bg"]')).toHaveStyle("--color-bg: #111111")
    expect(screen.getByText("8")).toBeInTheDocument()
  })

  it("renders a configured icon and formatted numeric value with an explicit indicator color", () => {
    withChart(
      <ChartTooltipContent
        active
        color="#987654"
        payload={[entry({ value: 1234, payload: {} })]}
      />,
    )

    expect(screen.getByLabelText("Series icon")).toBeInTheDocument()
    expect(screen.getByText((1234).toLocaleString())).toBeInTheDocument()
  })
})

describe("ChartLegendContent", () => {
  it("requires chart context and renders the empty state as nothing", () => {
    expect(() => render(<ChartLegendContent payload={[]} />)).toThrow(
      "useChart must be used within a <ChartContainer />",
    )

    withChart(<ChartLegendContent payload={[]} />)
    expect(screen.queryByText("Sales")).not.toBeInTheDocument()
  })

  it("renders icons and labels and falls back to color dots when icons are hidden", () => {
    withChart(
      <ChartLegendContent
        verticalAlign="top"
        payload={
          [
            { dataKey: "sales", color: "#123456", type: "line" },
            { dataKey: "unknown", color: "#abcdef", type: "square" },
            { dataKey: "profit", color: "#00ff00", type: "none" },
            "malformed",
          ] as unknown as ComponentProps<typeof ChartLegendContent>["payload"]
        }
      />,
    )

    expect(screen.getByLabelText("Series icon")).toBeInTheDocument()
    expect(screen.getByText("Sales")).toBeInTheDocument()
    expect(screen.queryByText("Profit")).not.toBeInTheDocument()
    expect(document.querySelector("[class*='pb-3']")).toBeInTheDocument()
  })

  it("omits icons and uses configured labels with a custom name key", () => {
    withChart(
      <ChartLegendContent
        hideIcon
        nameKey="kind"
        payload={
          [
            { kind: "sales", color: "#123456", type: "line" },
            { dataKey: "unknown", color: "#abcdef", type: "square" },
          ] as unknown as ComponentProps<typeof ChartLegendContent>["payload"]
        }
      />,
    )

    expect(screen.getByText("Sales")).toBeInTheDocument()
    expect(screen.queryByLabelText("Series icon")).not.toBeInTheDocument()
    expect(document.querySelector("[style*='background-color']")).toBeInTheDocument()
  })
})
