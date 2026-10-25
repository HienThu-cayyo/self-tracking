import "server-only"

export interface AiConfig {
  apiKey: string
  model: string
  baseUrl?: string
}

export interface AiEnv {
  AI_API_KEY?: string
  AI_MODEL?: string
  AI_BASE_URL?: string
}

const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"])

function readBaseUrl(value: string | undefined) {
  const input = value?.trim()
  if (!input) return undefined

  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new Error("AI_BASE_URL must be a valid URL")
  }

  if (url.username || url.password) {
    throw new Error("AI_BASE_URL must not contain credentials")
  }

  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopbackHosts.has(url.hostname))) {
    throw new Error("AI_BASE_URL must use HTTPS or loopback HTTP")
  }

  return url.toString().replace(/\/$/, "")
}

export function readAiConfig(env: AiEnv): AiConfig {
  const apiKey = env.AI_API_KEY?.trim()
  if (!apiKey) throw new Error("AI_API_KEY is required")

  const model = env.AI_MODEL?.trim()
  if (!model) throw new Error("AI_MODEL is required")

  const baseUrl = readBaseUrl(env.AI_BASE_URL)
  return { apiKey, model, ...(baseUrl ? { baseUrl } : {}) }
}
