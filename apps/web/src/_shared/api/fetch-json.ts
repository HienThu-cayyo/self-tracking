const DEFAULT_TIMEOUT_MS = 5_000

export interface FetchJsonOptions<T> {
  url: string
  schema: { parse(input: unknown): T }
  errorMessage: string
  method?: "GET" | "POST" | "PUT"
  body?: unknown
  fetchImpl?: typeof fetch
  signal?: AbortSignal
  cache?: RequestCache
  acceptResponse?: (response: Response) => boolean
}

export async function fetchJson<T>({
  url,
  schema,
  errorMessage,
  method = "GET",
  body,
  fetchImpl = fetch,
  signal,
  cache,
  acceptResponse,
}: FetchJsonOptions<T>): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" }
  const requestInit: RequestInit = {
    headers,
    method,
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(DEFAULT_TIMEOUT_MS)])
      : AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    ...(cache ? { cache } : {}),
  }

  if (body !== undefined) {
    headers["content-type"] = "application/json"
    requestInit.body = JSON.stringify(body)
  }

  const response = await fetchImpl(url, requestInit)
  if (!response.ok && !acceptResponse?.(response)) throw new Error(errorMessage)

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(errorMessage)
  }

  try {
    return schema.parse(payload)
  } catch {
    throw new Error(errorMessage)
  }
}
