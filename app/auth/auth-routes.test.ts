import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();
const createClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => createClient(),
}));

const { GET: callback } = await import("./callback/route");
const { GET: confirm } = await import("./confirm/route");

const ORIGIN = "https://veyoraq.test";
const req = (path: string) => new NextRequest(`${ORIGIN}${path}`);

function location(response: Response) {
  return new URL(response.headers.get("location") ?? "");
}

beforeEach(() => {
  exchangeCodeForSession.mockReset();
  verifyOtp.mockReset();
  createClient.mockReset();
  createClient.mockResolvedValue({
    auth: { exchangeCodeForSession, verifyOtp },
  });
});

describe("GET /auth/callback (Google)", () => {
  it("exchanges the code and sends the visitor to the next page", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const response = await callback(req("/auth/callback?code=abc&next=/saved"));
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(location(response).pathname).toBe("/saved");
    expect(location(response).origin).toBe(ORIGIN);
  });

  it("goes to /account by default", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const response = await callback(req("/auth/callback?code=abc"));
    expect(location(response).pathname).toBe("/account");
  });

  it("never redirects to another website", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    for (const next of ["https://evil.example", "//evil.example", "/\\evil.example"]) {
      const response = await callback(
        req(`/auth/callback?code=abc&next=${encodeURIComponent(next)}`),
      );
      expect(location(response).origin).toBe(ORIGIN);
      expect(location(response).pathname).toBe("/account");
    }
  });

  it("fails safely when the code is missing", async () => {
    const response = await callback(req("/auth/callback"));
    expect(location(response).pathname).toBe("/account");
    expect(location(response).searchParams.get("error")).toBe("sign_in_failed");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("fails safely when the provider reports an error", async () => {
    const response = await callback(
      req("/auth/callback?error=access_denied&code=abc"),
    );
    expect(location(response).searchParams.get("error")).toBe("sign_in_failed");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("fails safely when the exchange is rejected or throws", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: { message: "bad" } });
    expect(
      location(await callback(req("/auth/callback?code=abc"))).searchParams.get("error"),
    ).toBe("sign_in_failed");

    createClient.mockRejectedValueOnce(new Error("not configured"));
    expect(
      location(await callback(req("/auth/callback?code=abc"))).searchParams.get("error"),
    ).toBe("sign_in_failed");
  });
});

describe("GET /auth/confirm (email link)", () => {
  it("verifies the token hash and continues", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const response = await confirm(
      req("/auth/confirm?token_hash=hash123&type=email&next=/saved"),
    );
    expect(verifyOtp).toHaveBeenCalledWith({ type: "email", token_hash: "hash123" });
    expect(location(response).pathname).toBe("/saved");
  });

  it("accepts a password-reset link and sends the visitor to the reset page", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const response = await confirm(
      req("/auth/confirm?token_hash=hash123&type=recovery&next=/account/reset-password"),
    );
    expect(verifyOtp).toHaveBeenCalledWith({ type: "recovery", token_hash: "hash123" });
    expect(location(response).pathname).toBe("/account/reset-password");
  });

  it("accepts only the allowed link types", async () => {
    for (const type of ["invite", "email_change", "bogus"]) {
      const response = await confirm(
        req(`/auth/confirm?token_hash=hash123&type=${type}`),
      );
      expect(location(response).searchParams.get("error")).toBe("link_invalid");
    }
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("fails safely when the token is missing, expired or already used", async () => {
    const missing = await confirm(req("/auth/confirm?type=email"));
    expect(location(missing).searchParams.get("error")).toBe("link_invalid");

    verifyOtp.mockResolvedValue({ error: { code: "otp_expired" } });
    const expired = await confirm(
      req("/auth/confirm?token_hash=old&type=email"),
    );
    expect(location(expired).searchParams.get("error")).toBe("link_invalid");
  });

  it("never redirects to another website", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const response = await confirm(
      req(
        `/auth/confirm?token_hash=h&type=email&next=${encodeURIComponent("https://evil.example")}`,
      ),
    );
    expect(location(response).origin).toBe(ORIGIN);
    expect(location(response).pathname).toBe("/account");
  });
});
