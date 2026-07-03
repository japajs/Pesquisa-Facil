import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from "./constants"

interface Entry {
  count: number
  windowStart: number
}

const store = new Map<string, Entry>()

export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false

  entry.count++
  return true
}
