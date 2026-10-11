import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

/*
  Keeps a signed-in visitor's session fresh. Server Components cannot write
  cookies, so this runs in proxy.ts (Next.js 16's name for middleware) and
  stores the refreshed login cookies on both the request and the response.
  It only runs for the paths listed in proxy.ts.
*/
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const config = getSupabaseConfig();
  if (!config.ok) return response;

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Supabase asks that refreshed sessions are never cached by a CDN.
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Validates the session and refreshes it when it is close to expiring.
  await supabase.auth.getClaims();

  return response;
}
