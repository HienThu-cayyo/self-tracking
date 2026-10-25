export function readDatabaseUrl(env: Record<string, string | undefined>): string {
  const url = env.DATABASE_URL?.trim()
  if (!url) throw new Error("DATABASE_URL is not configured")
  return url
}
