# API client

`fetchJson` in `apps/web/src/_shared/api/fetch-json.ts` is a helper for JSON requests in both client-side and server-side code. It validates responses with `schema.parse` and maps HTTP, JSON, and schema errors to a caller-supplied message.

```ts
import { fetchJson } from "@/_shared/api/fetch-json"
import { z } from "zod"

const UserSchema = z.object({ id: z.string(), name: z.string() })

const user = await fetchJson({
  url: "/api/users/123",
  schema: UserSchema,
  errorMessage: "Could not load user",
})
// user is inferred as { id: string; name: string }
```

Options include `method` (defaults to `GET`; also supports `POST` and `PUT`), `body`, `fetchImpl` (for tests), `signal`, `cache`, and `acceptResponse` for statuses the caller explicitly accepts before parsing the response as JSON. The body is JSON-serialized, and the helper adds the content type automatically. It applies a 5-second timeout by default; when `signal` is provided, the timeout is combined with the caller's abort signal.

By default, non-2xx responses, malformed JSON, and schema validation failures throw `Error(errorMessage)` so response data is not exposed. Network and abort errors from `fetch` are preserved. To accept a non-2xx response, configure `acceptResponse` on the request.

Keep schemas near the contract that owns them and validate data at the point of entry. Do not use type assertions as a substitute for runtime checks. Routes that handle secrets or sensitive data must enforce authorization on the server; this helper does not add authentication, retries, or logging.

For client-side server-state caching, use TanStack Query with `fetchJson` as the query function; the root QueryClient provider is already mounted by `AppProviders`. Use server-side loading or `fetchJson` directly when a query cache and synchronization are unnecessary. See the [data-fetching and tables guide](data-fetching-and-tables.md).
