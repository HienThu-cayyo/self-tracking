import { describe, expect, it, vi } from "vitest"

import {
  createAiTextService,
  createConfiguredAiTextService,
  readAiConfig,
  type AiTextModel,
} from "../index.server"

const validEnv = {
  AI_API_KEY: "test-key",
  AI_MODEL: "test-model",
  AI_BASE_URL: "https://api.example.test/v1",
}

describe("AI text service", () => {
  it("requires a non-empty API key and model", () => {
    expect(() => readAiConfig({ AI_MODEL: "test-model" })).toThrow("AI_API_KEY is required")
    expect(() => readAiConfig({ AI_API_KEY: "test-key" })).toThrow("AI_MODEL is required")
    expect(() => readAiConfig({ AI_API_KEY: "  ", AI_MODEL: "test-model" })).toThrow(
      "AI_API_KEY is required",
    )
    expect(() => readAiConfig({ AI_API_KEY: "test-key", AI_MODEL: "  " })).toThrow(
      "AI_MODEL is required",
    )
  })

  it("allows HTTPS and loopback HTTP but rejects unsafe provider URLs", () => {
    expect(readAiConfig({ ...validEnv, AI_BASE_URL: "" })).toEqual({
      apiKey: "test-key",
      model: "test-model",
    })
    expect(readAiConfig({ ...validEnv, AI_BASE_URL: "  " }).baseUrl).toBeUndefined()
    expect(readAiConfig({ ...validEnv, AI_BASE_URL: "https://api.example.test/" }).baseUrl).toBe(
      "https://api.example.test",
    )
    expect(readAiConfig({ ...validEnv, AI_BASE_URL: "http://localhost:1234/v1" }).baseUrl).toBe(
      "http://localhost:1234/v1",
    )
    expect(readAiConfig({ ...validEnv, AI_BASE_URL: "http://127.0.0.1:1234/v1" }).baseUrl).toBe(
      "http://127.0.0.1:1234/v1",
    )
    expect(readAiConfig({ ...validEnv, AI_BASE_URL: "http://[::1]:1234/v1" }).baseUrl).toBe(
      "http://[::1]:1234/v1",
    )
    expect(() => readAiConfig({ ...validEnv, AI_BASE_URL: "http://provider.example/v1" })).toThrow(
      "AI_BASE_URL must use HTTPS or loopback HTTP",
    )
    expect(() =>
      readAiConfig({ ...validEnv, AI_BASE_URL: "https://user:secret@provider.example/v1" }),
    ).toThrow("AI_BASE_URL must not contain credentials")
    expect(() => readAiConfig({ ...validEnv, AI_BASE_URL: "not a URL" })).toThrow(
      "AI_BASE_URL must be a valid URL",
    )
  })

  it("does not construct a model when config is invalid", () => {
    const modelFactory = vi.fn<() => AiTextModel>()

    expect(() => createConfiguredAiTextService({}, modelFactory)).toThrow("AI_API_KEY is required")
    expect(modelFactory).not.toHaveBeenCalled()
  })

  it("generates text with an injected fake model", async () => {
    const model: AiTextModel = {
      generateText: vi.fn(async ({ systemPrompt, userPrompt }) => `${systemPrompt}: ${userPrompt}`),
    }
    const modelFactory = vi.fn(() => model)
    const service = createConfiguredAiTextService(validEnv, modelFactory)

    await expect(
      service.generateText({ systemPrompt: "Be concise", userPrompt: "Hello" }),
    ).resolves.toBe("Be concise: Hello")
    expect(modelFactory).toHaveBeenCalledWith({
      apiKey: "test-key",
      model: "test-model",
      baseUrl: "https://api.example.test/v1",
    })
  })

  it("preserves provider errors and propagates the abort signal", async () => {
    const providerError = new Error("provider unavailable")
    const controller = new AbortController()
    const model: AiTextModel = {
      generateText: vi.fn(
        ({ signal }) =>
          new Promise<string>((_resolve, reject) => {
            expect(signal).toBe(controller.signal)
            if (signal?.aborted) {
              reject(signal.reason)
              return
            }
            signal?.addEventListener("abort", () => reject(signal.reason), { once: true })
          }),
      ),
    }
    const service = createAiTextService(model)
    const aborted = service.generateText({
      systemPrompt: "Be concise",
      userPrompt: "Hello",
      signal: controller.signal,
    })
    controller.abort(new DOMException("Canceled", "AbortError"))

    await expect(aborted).rejects.toMatchObject({ name: "AbortError" })

    const failingService = createAiTextService({
      generateText: vi.fn().mockRejectedValue(providerError),
    })
    await expect(
      failingService.generateText({ systemPrompt: "Be concise", userPrompt: "Hello" }),
    ).rejects.toBe(providerError)
  })
})
