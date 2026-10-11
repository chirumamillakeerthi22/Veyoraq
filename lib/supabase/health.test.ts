import { describe, expect, it } from "vitest";
import { interpretProbe } from "./health";

describe("interpretProbe", () => {
  it("treats 'table not found' as connected", () => {
    const result = interpretProbe({
      error: { code: "PGRST205", message: "Could not find the table" },
      status: 404,
    });
    expect(result).toMatchObject({ ok: true, reachable: true, keyAccepted: true });
  });

  it("treats a successful read as connected", () => {
    expect(interpretProbe({ error: null, status: 200 }).ok).toBe(true);
  });

  it("reports a rejected key", () => {
    const result = interpretProbe({
      error: { code: "", message: "Invalid API key" },
      status: 401,
    });
    expect(result).toMatchObject({ ok: false, reachable: true, keyAccepted: false });
    expect(result.detail).toMatch(/key/i);
  });

  it("reports an unreachable project", () => {
    const result = interpretProbe({
      error: { code: "", message: "TypeError: fetch failed" },
      status: 0,
    });
    expect(result).toMatchObject({ ok: false, reachable: false });
    expect(result.detail).toMatch(/paused/i);
  });

  it("does not call an unexpected error a success", () => {
    const result = interpretProbe({
      error: { code: "XX000", message: "boom" },
      status: 500,
    });
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("500");
  });

  it("never echoes the upstream message", () => {
    const result = interpretProbe({
      error: { code: "XX000", message: "secret-internal-detail" },
      status: 500,
    });
    expect(JSON.stringify(result)).not.toContain("secret-internal-detail");
  });
});
