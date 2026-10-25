import { describe, expect, it, vi } from "vitest"

import { createAiTextService, createConfiguredAiTextService, readAiConfig } from "./index.server"

describe("AI server entry point", () => {
  it("exports config and text-service behavior to server consumers", async () => {
    const model = {
      generateText: vi.fn(async () => "Generated through the public entry point"),
    }
    const service = createAiTextService(model)
    const configuredService = createConfiguredAiTextService(
      { AI_API_KEY: "key", AI_MODEL: "model" },
      () => model,
    )

    expect(readAiConfig({ AI_API_KEY: " key ", AI_MODEL: " model " })).toEqual({
      apiKey: "key",
      model: "model",
    })
    await expect(
      service.generateText({ systemPrompt: "System", userPrompt: "User" }),
    ).resolves.toBe("Generated through the public entry point")
    await expect(
      configuredService.generateText({ systemPrompt: "System", userPrompt: "User" }),
    ).resolves.toBe("Generated through the public entry point")
  })
})
