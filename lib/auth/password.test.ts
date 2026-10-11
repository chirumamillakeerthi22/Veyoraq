import { describe, expect, it } from "vitest";
import { validatePassword } from "./password";

describe("validatePassword", () => {
  it.each(["correct-horse-7", "Abcdefg1", "my pass phrase 2026", "ünïcödé-pass-9"])(
    "accepts %j",
    (password) => {
      expect(validatePassword(password)).toEqual([]);
    },
  );

  it.each([
    ["too short", "abc1", /at least 8/],
    ["missing a number", "abcdefghij", /number/],
    ["missing a letter", "1234567890", /letter/],
    ["empty", "", /at least 8/],
  ])("rejects a password that is %s", (_label, password, expected) => {
    expect(validatePassword(password).join(" ")).toMatch(expected);
  });

  it("rejects the email address as a password, ignoring case and spaces", () => {
    expect(validatePassword("Person@Example.com", " person@example.com ")).toContain(
      "Don't use your email address as your password.",
    );
  });

  it("rejects anything over 72 bytes, counting multi-byte characters", () => {
    expect(validatePassword("a1" + "x".repeat(70))).toEqual([]);
    expect(validatePassword("a1" + "x".repeat(71)).join(" ")).toMatch(/too long/);
    expect(validatePassword("1" + "é".repeat(37)).join(" ")).toMatch(/too long/);
  });

  it("returns every problem, not just the first", () => {
    expect(validatePassword("ab").length).toBeGreaterThanOrEqual(2);
  });
});
