import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchProviderAvailability, parseAuthSettings } from "./auth-settings";

describe("parseAuthSettings", () => {
  it("reads the enabled providers", () => {
    expect(
      parseAuthSettings({ external: { google: true, email: false, github: true } }),
    ).toEqual({ google: true, email: false });
  });

  it.each([
    ["null", null],
    ["a string", "nope"],
    ["no external block", {}],
    ["a non-object external block", { external: 5 }],
  ])("returns unknown for %s", (_label, input) => {
    expect(parseAuthSettings(input)).toEqual({ google: null, email: null });
  });

  it("returns unknown for a field that is not a boolean", () => {
    expect(parseAuthSettings({ external: { google: "yes", email: true } })).toEqual({
      google: null,
      email: true,
    });
  });
});

describe("fetchProviderAvailability", () => {
  const fetchMock = vi.fn();
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  const config = { url: "https://abcdefghijklmnopqrst.supabase.co", key: "sb_publishable_x" };

  it("calls the settings endpoint with the public key and parses the answer", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ external: { google: false, email: true } })),
    );
    expect(await fetchProviderAvailability(config)).toEqual({ google: false, email: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${config.url}/auth/v1/settings`);
    expect(init.headers.apikey).toBe(config.key);
  });

  it("returns unknown (so nothing is hidden) when the request fails", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockRejectedValue(new Error("network"));
    expect(await fetchProviderAvailability(config)).toEqual({ google: null, email: null });
    fetchMock.mockResolvedValue(new Response("nope", { status: 500 }));
    expect(await fetchProviderAvailability(config)).toEqual({ google: null, email: null });
  });
});
