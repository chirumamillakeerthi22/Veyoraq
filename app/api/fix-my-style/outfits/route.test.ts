import { beforeEach, describe, expect, it, vi } from "vitest";

const createOutfits = vi.fn();
vi.mock("@/lib/fix-my-style/outfits", () => ({ createOutfits }));

const { POST } = await import("./route");
const { outfitsLimiter } = await import("@/lib/fix-my-style/http");

const request = {
  mode: "outfits",
  anchorId: null,
  items: [
    {
      id: "a",
      name: "Top",
      category: "tops",
      colours: ["cream"],
      pattern: null,
      material: null,
      seasons: [],
      occasions: [],
    },
  ],
  preferences: {
    occasion: null,
    season: null,
    aesthetic: null,
    formality: null,
    colours: [],
    mustInclude: [],
  },
};

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://veyoraq.test/api/fix-my-style/outfits", {
      method: "POST",
      headers: { host: "veyoraq.test", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/fix-my-style/outfits", () => {
  beforeEach(() => {
    createOutfits.mockReset();
    outfitsLimiter.reset();
  });

  it("returns the cleaned outfits", async () => {
    const data = { outfits: [], recommendations: [], limitations: "" };
    createOutfits.mockResolvedValue({ ok: true, data });
    const response = await post(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(data);
  });

  it("rejects requests that reference items not in the wardrobe", async () => {
    const bad = { ...request, preferences: { ...request.preferences, mustInclude: ["zzz"] } };
    expect((await post(bad)).status).toBe(400);
    expect(createOutfits).not.toHaveBeenCalled();
  });

  it("rejects photos or unknown fields in the request", async () => {
    const bad = {
      ...request,
      items: [{ ...request.items[0], photo: "data:image/jpeg;base64,AAAA" }],
    };
    expect((await post(bad)).status).toBe(400);
    expect(createOutfits).not.toHaveBeenCalled();
  });

  it("explains when no combination was possible", async () => {
    createOutfits.mockResolvedValue({ ok: false, code: "no_combinations", message: "None found" });
    const response = await post(request);
    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("no_combinations");
  });

  it("refuses cross-site requests", async () => {
    expect((await post(request, { origin: "https://evil.test" })).status).toBe(403);
  });

  it("rejects an oversized request", async () => {
    expect((await post("x".repeat(31_000))).status).toBe(413);
  });
});
