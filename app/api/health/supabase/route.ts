import { PROBE_TABLE, interpretProbe } from "@/lib/supabase/health";
import {
  SupabaseConfigError,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { clientKey, createRateLimiter } from "@/lib/stylist/rate-limit";

export const maxDuration = 15;

// A status page for the owner, but public, so keep it cheap and protected.
const healthLimiter = createRateLimiter({
  rules: [{ windowMs: 10 * 60_000, max: 20 }],
});

function reply(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

/*
  Reports whether the Supabase settings work. It never returns the URL, the key or
  any project detail, and it creates and reads nothing.
*/
export async function GET(request: Request) {
  const limit = healthLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return reply(
      { ok: false, detail: "Too many checks. Try again later." },
      429,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const config = getSupabaseConfig();
  if (!config.ok) {
    return reply(
      { ok: false, configured: false, reason: config.reason },
      503,
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error, status } = await supabase
      .from(PROBE_TABLE)
      .select("*")
      .limit(1)
      .abortSignal(AbortSignal.timeout(8_000));

    const health = interpretProbe({ error, status });
    return reply(
      { configured: true, keyKind: config.keyKind, ...health },
      health.ok ? 200 : 503,
    );
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return reply({ ok: false, configured: false, reason: error.reason }, 503);
    }
    console.error(
      "[supabase] health check failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return reply(
      {
        ok: false,
        configured: true,
        reachable: false,
        keyAccepted: false,
        detail: "The check could not complete. Try again.",
      },
      503,
    );
  }
}
