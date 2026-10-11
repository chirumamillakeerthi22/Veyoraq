import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Only these email link types are accepted.
const ALLOWED_TYPES = new Set<string>(["email", "magiclink", "signup"]);

/*
  Where the link inside the sign-in email lands. It carries a one-time token that is
  checked here on the server, so it works even if the email is opened in a different
  browser or app than the one the visitor started in.
*/
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const failure = NextResponse.redirect(
    new URL("/account?error=link_invalid", url.origin),
  );

  if (!tokenHash || !type || !ALLOWED_TYPES.has(type)) return failure;

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) return failure;
  } catch {
    return failure;
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
