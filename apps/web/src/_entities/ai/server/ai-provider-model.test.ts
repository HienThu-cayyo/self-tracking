import { afterEach, describe, expect, it, vi } from "vitest"

const { construct, invoke } = vi.hoisted(() => ({
  construct: vi.fn(),
  invoke: vi.fn(),
}))

vi.mock("@langchain/openai", () => ({
  ChatOpenAI: class {
    constructor(options: unknown) {
      construct(options)
    }

    invoke(...args: unknown[]) {
      return invoke(...args)
    }
  },
}))

import { createConfiguredAiTextService } from "../index.server"

const validEnv = {
  AI_API_KEY: "test-key",
  AI_MODEL: "test-model",
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe("default AI provider adapter", () => {
  it("passes safe provider options and returns text from ordered messages", async () => {
    invoke.mockResolvedValue({ content: "Generated answer" })

    const service = createConfiguredAiTextService({
      ...validEnv,
      AI_BASE_URL: "https://provider.example.test/v1",
    })

    await expect(
      service.generateText({ systemPrompt: "Be concise", userPrompt: "Hello" }),
    ).resolves.toBe("Generated answer")

    expect(construct).toHaveBeenCalledWith({
      apiKey: "test-key",
      model: "test-model",
      temperature: 0.2,
      timeout: 25_000,
      maxRetries: 0,
      configuration: { baseURL: "https://provider.example.test/v1" },
    })
    expect(invoke).toHaveBeenCalledWith(
      [
        { role: "system", content: "Be concise" },
        { role: "user", content: "Hello" },
      ],
      undefined,
    )
  })

  it("omits provider URL configuration and forwards an abort signal", async () => {
    invoke.mockResolvedValue({ content: "Canceled response" })
    const signal = new AbortController().signal
    const service = createConfiguredAiTextService(validEnv)

    await service.generateText({
      systemPrompt: "Be concise",
      userPrompt: "Hello",
      signal,
    })

    expect(construct).toHaveBeenCalledWith({
      apiKey: "test-key",
      model: "test-model",
      temperature: 0.2,
      timeout: 25_000,
      maxRetries: 0,
    })
    expect(invoke).toHaveBeenCalledWith(
      [
        { role: "system", content: "Be concise" },
        { role: "user", content: "Hello" },
      ],
      { signal },
    )
  })

  it("rejects non-text provider responses", async () => {
    invoke.mockResolvedValue({ content: [{ type: "text", text: "Hello" }] })
    const service = createConfiguredAiTextService(validEnv)

    await expect(
      service.generateText({ systemPrompt: "Be concise", userPrompt: "Hello" }),
    ).rejects.toThrow("AI provider returned a non-text response")
  })

  it("reads default environment variables and uses the default model factory", async () => {
    vi.stubEnv("AI_API_KEY", "default-key")
    vi.stubEnv("AI_MODEL", "default-model")
    vi.stubEnv("AI_BASE_URL", "")
    invoke.mockResolvedValue({ content: "Default response" })

    const service = createConfiguredAiTextService()

    await expect(
      service.generateText({ systemPrompt: "System", userPrompt: "User" }),
    ).resolves.toBe("Default response")
    expect(construct).toHaveBeenCalledWith({
      apiKey: "default-key",
      model: "default-model",
      temperature: 0.2,
      timeout: 25_000,
      maxRetries: 0,
    })
  })
})
