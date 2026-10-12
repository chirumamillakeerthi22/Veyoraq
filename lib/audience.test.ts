import { describe, expect, it } from "vitest";
import { audienceStore, audienceValues, DEFAULT_AUDIENCE, isAudience } from "./audience";

describe("audience", () => {
  it("offers exactly the four options and defaults to Women", () => {
    expect([...audienceValues]).toEqual(["women", "men", "boys", "girls"]);
    expect(DEFAULT_AUDIENCE).toBe("women");
    expect(audienceStore.getServerSnapshot()).toEqual({ audience: "women" });
  });

  it("recognises only valid values", () => {
    expect(isAudience("men")).toBe(true);
    expect(isAudience("everyone")).toBe(false);
    expect(isAudience(null)).toBe(false);
  });
});
