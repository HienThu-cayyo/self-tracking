import { ESLint } from "eslint"
import path from "node:path"
import { describe, expect, it } from "vitest"

const eslint = new ESLint({ cwd: process.cwd() })

async function restrictedImports(source: string, filePath = "src/_shared/api/boundary-probe.ts") {
  const [result] = await eslint.lintText(source, {
    filePath,
  })

  return result.messages.filter((message) => message.ruleId === "no-restricted-imports")
}

async function boundaryViolations(source: string, filePath: string) {
  const [result] = await eslint.lintText(source, { filePath })

  return result.messages.filter((message) => message.ruleId?.startsWith("boundaries/"))
}

describe("FSD import boundaries", () => {
  it.each([
    ["layer alias", 'import "@/_entities/ai/index.server"', "src/_shared/api/boundary-probe.ts"],
    [
      "relative layer path",
      'import "../../_entities/ai/index.server"',
      "src/_shared/api/boundary-probe.ts",
    ],
    ["Next app route", 'import "@/app/page"', "src/_shared/api/boundary-probe.ts"],
    ["Next app route from app providers", 'import "@/app/page"', "src/_app/providers.ts"],
  ])("rejects a forbidden %s import", async (_description, source, filePath) => {
    expect(await restrictedImports(source, filePath)).not.toHaveLength(0)
  })

  it.each([
    [
      "alias",
      'export const load = () => import("@/app/page")',
      "src/_shared/api/boundary-probe.ts",
    ],
    [
      "relative path",
      'export const load = () => import("../app/page")',
      "src/_app/boundary-probe.ts",
    ],
  ])("rejects upward dynamic imports by %s", async (_description, source, filePath) => {
    expect(await boundaryViolations(source, filePath)).not.toHaveLength(0)
  })

  it("allows same-slice internal imports", async () => {
    expect(
      await boundaryViolations('import "./ai-config"', "src/_entities/ai/server/boundary-probe.ts"),
    ).toHaveLength(0)
  })

  it.each([
    ["alias", 'import "@/_entities/ai/index.server"'],
    ["relative path", 'import "../../../_entities/ai/index.server"'],
  ])("allows lower-layer public API imports by %s", async (_description, source) => {
    expect(
      await boundaryViolations(source, "src/_features/catalog/ui/boundary-probe.ts"),
    ).toHaveLength(0)
  })

  it.each([
    ["alias", 'import "@/_entities/ai/index.server"'],
    ["relative path", 'import "../../ai/index.server"'],
  ])("rejects same-layer sibling slice imports by %s", async (_description, source) => {
    expect(
      await boundaryViolations(source, "src/_entities/payments/model/boundary-probe.ts"),
    ).not.toHaveLength(0)
  })

  it.each([
    ["alias", 'import "@/_entities/ai/server/ai-config"'],
    ["relative path", 'import "../../../_entities/ai/server/ai-config"'],
  ])("rejects lower-layer deep imports by %s", async (_description, source) => {
    expect(
      await boundaryViolations(source, "src/_features/catalog/ui/boundary-probe.ts"),
    ).not.toHaveLength(0)
  })

  it("keeps boundary rules scoped to the web app source", async () => {
    const databaseSource = path.resolve(process.cwd(), "../../packages/database/src/client.ts")
    const config = await eslint.calculateConfigForFile(databaseSource)
    const boundaryRules = Object.keys(config?.rules ?? {}).filter((ruleId) =>
      ruleId.startsWith("boundaries/"),
    )

    expect(boundaryRules).toHaveLength(0)
  })
})
