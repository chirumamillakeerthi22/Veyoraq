import { describe, expect, it } from "vitest";
import { describeSignInError, friendlyAuthMessage } from "./messages";

describe("friendlyAuthMessage", () => {
  it.each([
    [{ code: "provider_disabled" }, /Google sign-in isn't available/],
    [{ message: "Unsupported provider: provider is not enabled" }, /Google sign-in isn't available/],
    [{ code: "email_address_not_authorized" }, /can't send email to that address yet/],
    [{ message: "Email address \"x@y.z\" is not authorized" }, /can't send email to that address yet/],
    [{ code: "over_email_send_rate_limit" }, /Too many emails/],
    [{ message: "email rate limit exceeded" }, /Too many emails/],
    [{ code: "over_request_rate_limit" }, /Too many attempts/],
    [{ status: 429 }, /Too many attempts/],
    [{ code: "email_address_invalid" }, /doesn't look right/],
    [{ code: "otp_expired" }, /expired/],
    [{ message: "Token has expired or is invalid" }, /expired/],
    [{ code: "signup_disabled" }, /isn't available right now/],
    [{ code: "invalid_credentials" }, /email and password don't match/],
    [{ message: "Invalid login credentials" }, /email and password don't match/],
    [{ code: "user_already_exists" }, /already exists/],
    [{ message: "User already registered" }, /already exists/],
    [{ code: "weak_password" }, /too easy to guess/],
    [{ code: "same_password" }, /different from your current/],
    [{ code: "email_not_confirmed" }, /confirm your email/],
    [{ message: "Auth session missing!" }, /link has expired/],
    [{ code: "session_not_found" }, /link has expired/],
  ])("maps %j", (error, pattern) => {
    expect(friendlyAuthMessage(error)).toMatch(pattern);
  });

  it("falls back for unknown errors and for no error", () => {
    expect(friendlyAuthMessage({ code: "weird_new_code" })).toBe(
      "Something went wrong. Please try again.",
    );
    expect(friendlyAuthMessage(null)).toBe("Something went wrong. Please try again.");
  });

  it("never repeats the raw technical message", () => {
    const text = friendlyAuthMessage({
      code: "weird_new_code",
      message: "pq: relation auth.internal_table does not exist",
    });
    expect(text).not.toContain("pq:");
    expect(text).not.toContain("relation");
  });
});

describe("describeSignInError", () => {
  it("returns nothing when there is no error", () => {
    expect(describeSignInError(undefined)).toBeNull();
    expect(describeSignInError("")).toBeNull();
  });

  it("explains an expired link, and falls back for anything else", () => {
    expect(describeSignInError("link_invalid")).toMatch(/expired or was already used/);
    expect(describeSignInError("link_invalid")).not.toMatch(/code/i);
    expect(describeSignInError("sign_in_failed")).toMatch(/couldn't sign you in/);
    expect(describeSignInError("<script>")).toMatch(/couldn't sign you in/);
  });
});
