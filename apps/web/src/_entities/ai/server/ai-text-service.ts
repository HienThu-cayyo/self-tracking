import "server-only"

import { ChatOpenAI } from "@langchain/openai"

import { readAiConfig, type AiConfig, type AiEnv } from "./ai-config"

const AI_REQUEST_TIMEOUT_MS = 25_000

export interface GenerateTextInput {
  systemPrompt: string
  userPrompt: string
  signal?: AbortSignal
}

export interface AiTextModel {
  generateText(input: GenerateTextInput): Promise<string>
}

export type AiTextModelFactory = (config: AiConfig) => AiTextModel

export function createAiTextService(model: AiTextModel) {
  return {
    generateText(input: GenerateTextInput) {
      return model.generateText(input)
    },
  }
}

const createChatOpenAiModel: AiTextModelFactory = (config) => {
  const model = new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    temperature: 0.2,
    timeout: AI_REQUEST_TIMEOUT_MS,
    maxRetries: 0,
    ...(config.baseUrl ? { configuration: { baseURL: config.baseUrl } } : {}),
  })

  return {
    async generateText({ systemPrompt, userPrompt, signal }) {
      const response = await model.invoke(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        signal ? { signal } : undefined,
      )

      if (typeof response.content !== "string") {
        throw new Error("AI provider returned a non-text response")
      }

      return response.content
    },
  }
}

export function createConfiguredAiTextService(
  env: AiEnv = {
    AI_API_KEY: process.env.AI_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    AI_BASE_URL: process.env.AI_BASE_URL,
  },
  modelFactory: AiTextModelFactory = createChatOpenAiModel,
) {
  const config = readAiConfig(env)
  return createAiTextService(modelFactory(config))
}
