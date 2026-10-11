import { beforeEach, describe, expect, it, vi } from "vitest";

const limitSelect = vi.fn();
const server = {
  createSupabaseServerClient: vi.fn(),
};

class FakeConfigError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
  }
}

vi.mock("@/lib/supabase/server", () => ({
  get createSupabaseServerClient() {
    return server.createSupabaseServerClient;
  },
  SupabaseConfigError: FakeConfigError,
}));

const URL_VAR = "NEXT_PUBLIC_SUPABASE_URL";
const KEY_VAR = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

function fakeClient(result: { error: unknown; status: number }) {
  limitSelect.mockReturnValue({ abortSignal: () => Promise.resolve(result) });
  return {
    from: () => ({ select: () => ({ limit: limitSelect }) }),
  };
}

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

const request = (ip = "203.0.113.7") =>
  new Request("https://veyoraq.test/api/health/supabase", {
    headers: { "x-forwarded-for": ip },
  });

describe("GET /api/health/supabase", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv(URL_VAR, "https://abcdefghijklmnopqrst.supabase.co");
    vi.stubEnv(KEY_VAR, "sb_publishable_testkey");
    server.createSupabaseServerClient.mockReset();
  });

  it("reports connected when the project answers 'table not found'", async () => {
    server.createSupabaseServerClient.mockResolvedValue(
      fakeClient({ error: { code: "PGRST205" }, status: 404 }),
    );
    const { GET } = await loadRoute();
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      ok: true,
      configured: true,
      keyKind: "publishable",
      reachable: true,
      keyAccepted: true,
    });
  });

  it("reports a rejected key with 503", async () => {
    server.createSupabaseServerClient.mockResolvedValue(
      fakeClient({ error: { message: "Invalid API key" }, status: 401 }),
    );
    const { GET } = await loadRoute();
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, keyAccepted: false });
  });

  it("reports an unreachable project with 503", async () => {
    server.createSupabaseServerClient.mockResolvedValue(
      fakeClient({ error: { message: "fetch failed" }, status: 0 }),
    );
    const { GET } = await loadRoute();
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, reachable: false });
  });

  it("reports not configured without contacting Supabase", async () => {
    vi.stubEnv(URL_VAR, "");
    const { GET } = await loadRoute();
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      configured: false,
      reason: "missing",
    });
    expect(server.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("refuses to run with a secret key in the public variable", async () => {
    vi.stubEnv(KEY_VAR, "sb_secret_dontdothis");
    const { GET } = await loadRoute();
    const response = await GET(request());
    const text = await response.text();
    expect(response.status).toBe(503);
    expect(text).toContain("secret_key_in_public_variable");
    expect(text).not.toContain("sb_secret_dontdothis");
    expect(server.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("never returns the URL or the key", async () => {
    server.createSupabaseServerClient.mockResolvedValue(
      fakeClient({ error: { code: "PGRST205" }, status: 404 }),
    );
    const { GET } = await loadRoute();
    const text = await (await GET(request())).text();
    expect(text).not.toContain("abcdefghijklmnopqrst");
    expect(text).not.toContain("sb_publishable_testkey");
  });

  it("returns a safe message if the client throws unexpectedly", async () => {
    server.createSupabaseServerClient.mockRejectedValue(new Error("kaboom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { GET } = await loadRoute();
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("kaboom");
  });

  it("rate limits repeated checks from one visitor", async () => {
    server.createSupabaseServerClient.mockResolvedValue(
      fakeClient({ error: { code: "PGRST205" }, status: 404 }),
    );
    const { GET } = await loadRoute();
    for (let i = 0; i < 20; i += 1) {
      expect((await GET(request("198.51.100.9"))).status).toBe(200);
    }
    const blocked = await GET(request("198.51.100.9"));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    expect((await GET(request("192.0.2.4"))).status).toBe(200);
  });
});
