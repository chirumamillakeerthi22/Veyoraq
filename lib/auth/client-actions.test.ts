import { describe, expect, it, vi } from "vitest";
import {
  isPlausibleEmail,
  isSixDigitCode,
  sendEmailCode,
  signInWithGoogle,
  verifyEmailCode,
  type AuthApi,
} from "./client-actions";

function fakeAuth(error: unknown = null) {
  const calls = {
    signInWithOAuth: vi.fn().mockResolvedValue({ error }),
    signInWithOtp: vi.fn().mockResolvedValue({ error }),
    verifyOtp: vi.fn().mockResolvedValue({ error }),
  };
  return { calls, auth: calls as unknown as AuthApi };
}

const ORIGIN = "https://veyoraq.test";

describe("validation helpers", () => {
  it.each([
    ["a@b.co", true],
    ["  person@example.com  ", true],
    ["no-at-sign.com", false],
    ["two@@example.com", false],
    ["spaces in@example.com", false],
    ["a@b", false],
    ["", false],
  ])("isPlausibleEmail(%j) is %s", (value, expected) => {
    expect(isPlausibleEmail(value)).toBe(expected);
  });

  it.each([
    ["123456", true],
    [" 123456 ", true],
    ["12345", false],
    ["1234567", false],
    ["12345a", false],
    ["", false],
  ])("isSixDigitCode(%j) is %s", (value, expected) => {
    expect(isSixDigitCode(value)).toBe(expected);
  });
});

describe("signInWithGoogle", () => {
  it("asks for Google and returns to our callback with a safe next path", async () => {
    const { calls, auth } = fakeAuth();
    const result = await signInWithGoogle(auth, ORIGIN, "/saved");
    expect(result).toEqual({ ok: true });
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
    const { auth } = fakeAuth({ message: "Unsupported provider: provider is not enabled" });
    const result = await signInWithGoogle(auth, ORIGIN);
    expect(result).toMatchObject({ ok: false });
    expect(JSON.stringify(result)).toMatch(/Google sign-in isn't available/);
  });
});

describe("sendEmailCode", () => {
  it("sends a code and points the link at the confirm route", async () => {
    const { calls, auth } = fakeAuth();
    const result = await sendEmailCode(auth, " person@example.com ", ORIGIN);
    expect(result).toEqual({ ok: true });
    const arg = calls.signInWithOtp.mock.calls[0][0];
    expect(arg.email).toBe("person@example.com");
    expect(arg.options.shouldCreateUser).toBe(true);
    const link = new URL(arg.options.emailRedirectTo);
    expect(link.origin).toBe(ORIGIN);
    expect(link.pathname).toBe("/auth/confirm");
  });

  it("does not contact Supabase for an invalid email", async () => {
    const { calls, auth } = fakeAuth();
    const result = await sendEmailCode(auth, "not-an-email", ORIGIN);
    expect(result).toMatchObject({ ok: false });
    expect(calls.signInWithOtp).not.toHaveBeenCalled();
  });

  it("explains the free-plan email restriction kindly", async () => {
    const { auth } = fakeAuth({
      code: "email_address_not_authorized",
      message: "Email address is not authorized",
    });
    const result = await sendEmailCode(auth, "person@example.com", ORIGIN);
    expect(JSON.stringify(result)).toMatch(/Continue with Google/);
  });

  it("explains an email rate limit", async () => {
    const { auth } = fakeAuth({ code: "over_email_send_rate_limit" });
    const result = await sendEmailCode(auth, "person@example.com", ORIGIN);
    expect(JSON.stringify(result)).toMatch(/Too many emails/);
  });
});

describe("verifyEmailCode", () => {
  it("verifies a six-digit code for the email", async () => {
    const { calls, auth } = fakeAuth();
    const result = await verifyEmailCode(auth, "person@example.com", " 123456 ");
    expect(result).toEqual({ ok: true });
    expect(calls.verifyOtp).toHaveBeenCalledWith({
      email: "person@example.com",
      token: "123456",
      type: "email",
    });
  });

  it("rejects a malformed code without contacting Supabase", async () => {
    const { calls, auth } = fakeAuth();
    const result = await verifyEmailCode(auth, "person@example.com", "12ab");
    expect(result).toMatchObject({ ok: false });
    expect(calls.verifyOtp).not.toHaveBeenCalled();
  });

  it("reports a wrong or expired code", async () => {
    const { auth } = fakeAuth({ code: "otp_expired" });
    const result = await verifyEmailCode(auth, "person@example.com", "123456");
    expect(JSON.stringify(result)).toMatch(/expired/);
  });
});
