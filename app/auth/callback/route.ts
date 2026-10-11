import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/*
  Where Google sends the visitor back to after they approve. The address carries a
  one-time "code", which is exchanged for a login session stored in cookies.
*/
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const failure = NextResponse.redirect(
    new URL("/account?error=sign_in_failed", url.origin),
  );

  // Google or Supabase reported a problem, or the visitor cancelled.
  if (url.searchParams.get("error") || !code) return failure;

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return failure;
  } catch {
    return failure;
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
