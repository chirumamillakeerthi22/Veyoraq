export type AuthErrorLike =
  | { code?: string | null; message?: string | null; status?: number | null }
  | null
  | undefined;

/*
  Turns a Supabase Auth error into a short, kind sentence for the visitor.
  The raw message is never shown, because it can contain technical detail.
  Unknown errors fall back to a generic sentence.
*/
export function friendlyAuthMessage(error: AuthErrorLike): string {
  const code = (error?.code ?? "").toLowerCase();
  const message = (error?.message ?? "").toLowerCase();
  const status = error?.status ?? 0;

  if (
    code === "provider_disabled" ||
    message.includes("provider is not enabled") ||
    message.includes("unsupported provider")
  ) {
    return "Google sign-in isn't available yet. Please use email instead.";
  }

  if (code === "email_address_not_authorized" || message.includes("not authorized")) {
    return "Email sign-in isn't open to everyone yet. Please use Continue with Google.";
  }

  if (code === "over_email_send_rate_limit" || message.includes("email rate limit")) {
    return "Too many emails were requested. Please wait a few minutes and try again.";
  }

  if (code === "over_request_rate_limit" || status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (code === "email_address_invalid" || message.includes("invalid format")) {
    return "That email address doesn't look right.";
  }

  if (code === "otp_expired" || message.includes("expired")) {
    return "That code has expired. Please ask for a new one.";
  }

  if (code === "otp_disabled" || code === "signup_disabled" || code === "email_provider_disabled") {
    return "Email sign-in isn't available right now.";
  }

  if (message.includes("invalid")) {
    return "That code isn't right. Check it and try again.";
  }

  return "Something went wrong. Please try again.";
}

// Messages for the ?error= value the callback routes add to /account.
export function describeSignInError(code: string | undefined): string | null {
  switch (code) {
    case undefined:
    case "":
      return null;
    case "link_invalid":
      return "That sign-in link has expired or was already used. Please sign in again.";
    default:
      return "We couldn't sign you in. Please try again.";
  }
}
