import { describe, expect, it } from "vitest";
import { audienceStore, audienceValues, DEFAULT_AUDIENCE, isAudience } from "./audience";

describe("audience", () => {
  it("offers exactly Women and Men and defaults to Women", () => {
    expect([...audienceValues]).toEqual(["women", "men"]);
    expect(DEFAULT_AUDIENCE).toBe("women");
    expect(audienceStore.getServerSnapshot()).toEqual({ audience: "women" });
  });

  it("recognises only the two valid values (boys and girls are gone)", () => {
    expect(isAudience("men")).toBe(true);
    expect(isAudience("women")).toBe(true);
    expect(isAudience("boys")).toBe(false);
    expect(isAudience("girls")).toBe(false);
    expect(isAudience(null)).toBe(false);
  });
});
