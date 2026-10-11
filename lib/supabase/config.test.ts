import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyKey, getSupabaseConfig } from "./config";

// A JWT-shaped string with the given role in its payload (signature is irrelevant here).
function jwt(role: string) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ role })}.signature`;
}

describe("classifyKey", () => {
  it.each([
    ["sb_publishable_abc123", "publishable"],
    ["sb_secret_abc123", "secret"],
    [jwt("anon"), "anon"],
    [jwt("service_role"), "secret"],
    ["not-a-key", "unknown"],
    ["a.b.c", "unknown"],
    ["", "unknown"],
  ])("%s is %s", (key, expected) => {
    expect(classifyKey(key)).toBe(expected);
  });
});

describe("getSupabaseConfig", () => {
  afterEach(() => vi.unstubAllEnvs());

  const set = (url: string | undefined, key: string | undefined) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url ?? "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key ?? "");
  };

  it("accepts a hosted project URL with a publishable key", () => {
    set("https://abcdefghijklmnopqrst.supabase.co", "sb_publishable_xyz");
    expect(getSupabaseConfig()).toEqual({
      ok: true,
      url: "https://abcdefghijklmnopqrst.supabase.co",
      key: "sb_publishable_xyz",
      keyKind: "publishable",
    });
  });

  it("accepts a local development URL over http", () => {
    set("http://127.0.0.1:54321", "sb_publishable_xyz");
    expect(getSupabaseConfig().ok).toBe(true);
  });

  it("trims stray whitespace", () => {
    set("  https://abcdefghijklmnopqrst.supabase.co  ", "  sb_publishable_xyz ");
    expect(getSupabaseConfig()).toMatchObject({ ok: true, key: "sb_publishable_xyz" });
  });

  it.each([
    ["no URL", undefined, "sb_publishable_xyz"],
    ["no key", "https://abcdefghijklmnopqrst.supabase.co", undefined],
    ["both missing", undefined, undefined],
    ["whitespace only", "   ", "   "],
  ])("reports missing for %s", (_label, url, key) => {
    set(url, key);
    expect(getSupabaseConfig()).toEqual({ ok: false, reason: "missing" });
  });

  it.each([
    ["not a URL", "abcdefghijklmnopqrst.supabase.co"],
    ["plain http on a real host", "http://abcdefghijklmnopqrst.supabase.co"],
    ["a different scheme", "ftp://abcdefghijklmnopqrst.supabase.co"],
  ])("rejects %s", (_label, url) => {
    set(url, "sb_publishable_xyz");
    expect(getSupabaseConfig()).toEqual({ ok: false, reason: "invalid_url" });
  });

  it("refuses a secret key in a public variable, whatever its format", () => {
    set("https://abcdefghijklmnopqrst.supabase.co", "sb_secret_abc");
    expect(getSupabaseConfig()).toEqual({
      ok: false,
      reason: "secret_key_in_public_variable",
    });
    set("https://abcdefghijklmnopqrst.supabase.co", jwt("service_role"));
    expect(getSupabaseConfig()).toEqual({
      ok: false,
      reason: "secret_key_in_public_variable",
    });
  });

  it("never includes the key in a failure result", () => {
    set("https://abcdefghijklmnopqrst.supabase.co", "sb_secret_abc");
    expect(JSON.stringify(getSupabaseConfig())).not.toContain("sb_secret_abc");
  });
});
