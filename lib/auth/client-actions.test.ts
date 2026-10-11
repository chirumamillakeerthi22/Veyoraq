import { describe, expect, it, vi } from "vitest";
import {
  isPlausibleEmail,
  requestPasswordReset,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  updatePassword,
  type AuthApi,
} from "./client-actions";

function fakeAuth(options: { error?: unknown; session?: unknown } = {}) {
  const { error = null, session = null } = options;
  const calls = {
    signInWithOAuth: vi.fn().mockResolvedValue({ error }),
    signInWithPassword: vi.fn().mockResolvedValue({ error }),
    signUp: vi.fn().mockResolvedValue({ data: { session, user: {} }, error }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error }),
    updateUser: vi.fn().mockResolvedValue({ error }),
  };
  return { calls, auth: calls as unknown as AuthApi };
}

const ORIGIN = "https://veyoraq.test";
const GOOD_PASSWORD = "correct-horse-7";

describe("isPlausibleEmail", () => {
  it.each([
    ["a@b.co", true],
    ["  person@example.com  ", true],
    ["no-at-sign.com", false],
    ["two@@example.com", false],
    ["spaces in@example.com", false],
    ["a@b", false],
    ["", false],
  ])("%j is %s", (value, expected) => {
    expect(isPlausibleEmail(value)).toBe(expected);
  });
});

describe("signInWithGoogle", () => {
  it("asks for Google and returns to our callback with a safe next path", async () => {
    const { calls, auth } = fakeAuth();
    expect(await signInWithGoogle(auth, ORIGIN, "/saved")).toEqual({ ok: true });
    const arg = calls.signInWithOAuth.mock.calls[0][0];
    expect(arg.provider).toBe("google");
    const redirect = new URL(arg.options.redirectTo);
    expect(redirect.origin).toBe(ORIGIN);
    expect(redirect.pathname).toBe("/auth/callback");
    expect(redirect.searchParams.get("next")).toBe("/saved");
  });

  it("replaces a hostile next path with the default", async () => {
    const { calls, auth } = fakeAuth();
    await signInWithGoogle(auth, ORIGIN, "https://evil.example");
    const redirect = new URL(calls.signInWithOAuth.mock.calls[0][0].options.redirectTo);
    expect(redirect.searchParams.get("next")).toBe("/account");
  });

  it("returns a friendly message when Google is not enabled", async () => {
    const { auth } = fakeAuth({ error: { message: "Unsupported provider: provider is not enabled" } });
    const result = await signInWithGoogle(auth, ORIGIN);
    expect(JSON.stringify(result)).toMatch(/Google sign-in isn't available/);
  });
});

describe("signInWithPassword", () => {
  it("signs in with the trimmed email and the password as typed", async () => {
    const { calls, auth } = fakeAuth();
    const result = await signInWithPassword(auth, "  person@example.com ", " my pass ");
    expect(result).toEqual({ ok: true });
    expect(calls.signInWithPassword).toHaveBeenCalledWith({
      email: "person@example.com",
      password: " my pass ",
    });
  });

  it("does not contact Supabase for a bad email or an empty password", async () => {
    const { calls, auth } = fakeAuth();
    expect(await signInWithPassword(auth, "nope", "x")).toMatchObject({ ok: false });
    expect(await signInWithPassword(auth, "a@b.co", "")).toMatchObject({ ok: false });
    expect(calls.signInWithPassword).not.toHaveBeenCalled();
  });

  it("says email and password don't match without revealing which was wrong", async () => {
    const { auth } = fakeAuth({ error: { code: "invalid_credentials", message: "Invalid login credentials" } });
    const result = await signInWithPassword(auth, "a@b.co", "whatever1");
    expect(JSON.stringify(result)).toMatch(/email and password don't match/);
  });

  it("reports a rate limit with how long to wait, and does not retry", async () => {
    const { calls, auth } = fakeAuth({ error: { code: "over_request_rate_limit", status: 429 } });
    const result = await signInWithPassword(auth, "a@b.co", "whatever1");
    expect(result).toMatchObject({ ok: false, retryAfterSeconds: 60 });
    expect(calls.signInWithPassword).toHaveBeenCalledTimes(1);
  });

  it("asks an unconfirmed visitor to confirm their email", async () => {
    const { auth } = fakeAuth({ error: { code: "email_not_confirmed" } });
    const result = await signInWithPassword(auth, "a@b.co", "whatever1");
    expect(JSON.stringify(result)).toMatch(/confirm your email/);
  });
});

describe("signUpWithPassword", () => {
  it("creates the account and reports signed in when a session comes back", async () => {
    const { calls, auth } = fakeAuth({ session: { access_token: "x" } });
    const result = await signUpWithPassword(auth, "person@example.com", GOOD_PASSWORD, ORIGIN);
    expect(result).toEqual({ ok: true, signedIn: true });
    const arg = calls.signUp.mock.calls[0][0];
    expect(arg.email).toBe("person@example.com");
    expect(arg.password).toBe(GOOD_PASSWORD);
    expect(new URL(arg.options.emailRedirectTo).pathname).toBe("/auth/callback");
  });

  it("reports not signed in when confirmation is required (no session)", async () => {
    const { auth } = fakeAuth({ session: null });
    expect(await signUpWithPassword(auth, "person@example.com", GOOD_PASSWORD, ORIGIN)).toEqual({
      ok: true,
      signedIn: false,
    });
  });

  it.each([
    ["too short", "a1"],
    ["no number", "onlyletters"],
    ["no letter", "12345678"],
    ["the email itself", "person@example.com"],
  ])("rejects a password that is %s, without contacting Supabase", async (_label, password) => {
    const { calls, auth } = fakeAuth();
    const result = await signUpWithPassword(auth, "person@example.com", password, ORIGIN);
    expect(result).toMatchObject({ ok: false });
    expect(calls.signUp).not.toHaveBeenCalled();
  });

  it("tells a visitor an account already exists", async () => {
    const { auth } = fakeAuth({ error: { code: "user_already_exists" } });
    const result = await signUpWithPassword(auth, "person@example.com", GOOD_PASSWORD, ORIGIN);
    expect(JSON.stringify(result)).toMatch(/already exists/);
  });

  it("passes on an email-limit wait", async () => {
    const { auth } = fakeAuth({ error: { code: "over_email_send_rate_limit" } });
    const result = await signUpWithPassword(auth, "person@example.com", GOOD_PASSWORD, ORIGIN);
    expect(result).toMatchObject({ ok: false, retryAfterSeconds: 300 });
  });
});

describe("requestPasswordReset", () => {
  it("sends the reset link back to the reset page through our callback", async () => {
    const { calls, auth } = fakeAuth();
    expect(await requestPasswordReset(auth, " person@example.com ", ORIGIN)).toEqual({ ok: true });
    const [email, options] = calls.resetPasswordForEmail.mock.calls[0];
    expect(email).toBe("person@example.com");
    const redirect = new URL(options.redirectTo);
    expect(redirect.pathname).toBe("/auth/callback");
    expect(redirect.searchParams.get("next")).toBe("/account/reset-password");
  });

  it("does not contact Supabase for an invalid email", async () => {
    const { calls, auth } = fakeAuth();
    expect(await requestPasswordReset(auth, "nope", ORIGIN)).toMatchObject({ ok: false });
    expect(calls.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("waits out the per-address cooldown instead of retrying", async () => {
    const { auth } = fakeAuth({
      error: { status: 429, message: "For security purposes, you can only request this after 42 seconds." },
    });
    const result = await requestPasswordReset(auth, "person@example.com", ORIGIN);
    expect(result).toMatchObject({ ok: false, retryAfterSeconds: 43 });
  });
});

describe("updatePassword", () => {
  it("sets a valid new password", async () => {
    const { calls, auth } = fakeAuth();
    expect(await updatePassword(auth, GOOD_PASSWORD, "person@example.com")).toEqual({ ok: true });
    expect(calls.updateUser).toHaveBeenCalledWith({ password: GOOD_PASSWORD });
  });

  it("rejects a weak password without contacting Supabase", async () => {
    const { calls, auth } = fakeAuth();
    expect(await updatePassword(auth, "short1")).toMatchObject({ ok: false });
    expect(calls.updateUser).not.toHaveBeenCalled();
  });

  it("explains an expired reset link", async () => {
    const { auth } = fakeAuth({ error: { message: "Auth session missing!" } });
    const result = await updatePassword(auth, GOOD_PASSWORD);
    expect(JSON.stringify(result)).toMatch(/expired/);
  });

  it("explains reusing the current password", async () => {
    const { auth } = fakeAuth({ error: { code: "same_password" } });
    const result = await updatePassword(auth, GOOD_PASSWORD);
    expect(JSON.stringify(result)).toMatch(/different/);
  });
});
