/*
  A small in-memory rate limiter for the outfit endpoint.

  IMPORTANT LIMITS, so nobody over-trusts it:
  - Counters live in the memory of one server instance. On Vercel, several
    instances can run at once and instances restart, so this is a best-effort
    guard, not a hard guarantee.
  - The real, shared protection is a Vercel Firewall rate-limit rule plus a
    quota on the Gemini key. See project_status.md.
  - It stores nothing outside memory: no database, no files.
*/

export type RateLimitRule = {
  windowMs: number;
  max: number;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

type Options = {
  rules: RateLimitRule[];
  // Upper bound on tracked clients, so memory cannot grow without limit.
  maxKeys?: number;
  // Replaceable clock, used by tests.
  now?: () => number;
};

export function createRateLimiter({
  rules,
  maxKeys = 5_000,
  now = Date.now,
}: Options) {
  const longestWindow = Math.max(...rules.map((rule) => rule.windowMs));
  const mostRequests = Math.max(...rules.map((rule) => rule.max));
  // key -> timestamps of recent allowed requests, oldest first. Map order doubles
  // as least-recently-used order, because a key is re-inserted on every access.
  const hits = new Map<string, number[]>();

  function evictIfNeeded() {
    if (hits.size <= maxKeys) return;
    const cutoff = now() - longestWindow;
    for (const [key, times] of hits) {
      if (times[times.length - 1] <= cutoff) hits.delete(key);
    }
    while (hits.size > maxKeys) {
      const oldest = hits.keys().next().value;
      if (oldest === undefined) break;
      hits.delete(oldest);
    }
  }

  return {
    // Records the request and says whether it may proceed. A refused request is
    // not recorded, so being refused never extends the wait.
    check(key: string): RateLimitResult {
      const time = now();
      const recent = (hits.get(key) ?? []).filter(
        (timestamp) => timestamp > time - longestWindow,
      );

      let retryAfterMs = 0;
      for (const rule of rules) {
        const inWindow = recent.filter(
          (timestamp) => timestamp > time - rule.windowMs,
        );
        if (inWindow.length >= rule.max) {
          // The slot frees up when the oldest request in range leaves the window.
          const frees = inWindow[inWindow.length - rule.max] + rule.windowMs - time;
          retryAfterMs = Math.max(retryAfterMs, frees);
        }
      }

      hits.delete(key);
      if (retryAfterMs > 0) {
        if (recent.length > 0) hits.set(key, recent);
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        };
      }

      recent.push(time);
      // Keep only what the largest rule can ever need.
      hits.set(key, recent.slice(-mostRequests));
      evictIfNeeded();
      return { allowed: true };
    },
    reset() {
      hits.clear();
    },
    size() {
      return hits.size;
    },
  };
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

// Per visitor: a short burst allowance and a daily allowance.
export const stylistLimiter = createRateLimiter({
  rules: [
    { windowMs: 10 * MINUTE, max: 8 },
    { windowMs: DAY, max: 40 },
  ],
});

/*
  Identifies the visitor by IP address. On Vercel the platform sets these headers
  itself and overwrites any value a client sends, so they cannot be spoofed there.
  If the app were ever hosted elsewhere, put a trusted proxy in front or revisit this.
*/
export function clientKey(request: Request): string {
  const raw =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip");
  const first = raw?.split(",")[0]?.trim();
  return first && first.length <= 64 ? first : "unknown";
}

export function describeWait(seconds: number): string {
  if (seconds < 90) return "a minute";
  if (seconds < 3_600) return `${Math.ceil(seconds / 60)} minutes`;
  const hours = Math.ceil(seconds / 3_600);
  return hours === 1 ? "an hour" : `${hours} hours`;
}
