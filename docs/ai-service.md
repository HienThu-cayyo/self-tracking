# AI text service

The AI service is server-only and lives in `apps/web/src/_entities/ai`. Do not import it from a Client Component. Environment variables are needed only when creating the service; the API key is not required for dev, test, or build commands.

```dotenv
AI_API_KEY=...
AI_MODEL=...
# Optional: HTTPS, or HTTP for localhost/loopback only.
# AI_BASE_URL=https://api.openai.com/v1
```

`AI_API_KEY` and `AI_MODEL` are required when creating the service. `AI_BASE_URL` accepts HTTPS or loopback HTTP only, and rejects URLs containing credentials. Configuration errors never print secret values.

```ts
import { createConfiguredAiTextService } from "@/_entities/ai/index.server"

const ai = createConfiguredAiTextService()
const text = await ai.generateText({
  systemPrompt: "Answer briefly.",
  userPrompt: "Explain this result.",
})
```

`generateText` accepts system and user prompts and an optional `AbortSignal` (a Route Handler can pass `request.signal`). The service applies a 25-second timeout, does not retry, and returns text only. Use `createAiTextService` with a fake `AiTextModel` in unit tests. Never call a live provider from tests.

The starter does not include an AI API route. Before exposing AI through a public endpoint, add server-side authentication and authorization, rate limiting, budget limits, and input and output controls. Keep the API key on the server; never pass it through props, responses, or `NEXT_PUBLIC_*` variables.
