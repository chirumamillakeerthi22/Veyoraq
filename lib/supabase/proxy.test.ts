import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { updateSession } from "./proxy";

describe("updateSession", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("passes the request straight through when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    const response = await updateSession(new NextRequest("https://veyoraq.test/account"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("passes through when a secret key was put in the public variable", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefghijklmnopqrst.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_nope");
    const response = await updateSession(new NextRequest("https://veyoraq.test/account"));
    expect(response.status).toBe(200);
  });
});
