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
    return "Google sign-in isn't available yet. Please use email and password instead.";
  }

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "That email and password don't match. Check them and try again.";
  }

  if (code === "user_already_exists" || message.includes("already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (code === "weak_password" || message.includes("password should")) {
    return "That password is too easy to guess. Try a longer one with letters and numbers.";
  }

  if (code === "same_password") {
    return "Choose a password that is different from your current one.";
  }

  if (code === "email_not_confirmed") {
    return "Please confirm your email address first. Check your inbox for the link.";
  }

  if (
    code === "session_not_found" ||
    code === "refresh_token_not_found" ||
    message.includes("session missing")
  ) {
    return "That link has expired. Please request a new one.";
  }

  if (code === "email_address_not_authorized" || message.includes("not authorized")) {
    return "We can't send email to that address yet while email sending is being set up. Please use Google instead.";
  }

  if (code === "over_email_send_rate_limit" || message.includes("email rate limit")) {
    return "Too many emails were requested. Please wait a few minutes and try again.";
  }

  if (code === "over_request_rate_limit" || status === 429 || message.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (code === "email_address_invalid" || message.includes("invalid format")) {
    return "That email address doesn't look right.";
  }

  if (code === "otp_expired" || message.includes("expired")) {
    return "That link or code has expired. Please ask for a new one.";
  }

  if (
    code === "signup_disabled" ||
    code === "email_provider_disabled" ||
    code === "otp_disabled"
  ) {
    return "Email sign-in isn't available right now.";
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
      return "That link has expired or was already used. Please sign in again.";
    default:
      return "We couldn't sign you in. Please try again.";
  }
}
