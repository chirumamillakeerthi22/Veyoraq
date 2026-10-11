import { describe, expect, it } from "vitest";
import { safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  it.each([
    ["/account", "/account"],
    ["/saved", "/saved"],
    ["/stylist?occasion=work", "/stylist?occasion=work"],
    ["/saved/abc-123", "/saved/abc-123"],
  ])("keeps the local path %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each([
    ["an absolute URL", "https://evil.example/steal"],
    ["a protocol-relative URL", "//evil.example"],
    ["a backslash trick", "/\\evil.example"],
    ["a scheme without slashes", "javascript:alert(1)"],
    ["a path not starting with a slash", "account"],
    ["a control character", "/account\n//evil.example"],
    ["an encoded absolute URL smuggled behind a slash", "/\t/evil.example"],
  ])("falls back for %s", (_label, input) => {
    expect(safeNextPath(input)).toBe("/account");
  });

  it("falls back when missing or empty", () => {
    expect(safeNextPath(null)).toBe("/account");
    expect(safeNextPath(undefined)).toBe("/account");
    expect(safeNextPath("")).toBe("/account");
  });

  it("uses the supplied fallback", () => {
    expect(safeNextPath("https://evil.example", "/saved")).toBe("/saved");
  });

  it("drops a fragment", () => {
    expect(safeNextPath("/account#section")).toBe("/account");
  });
});
