import { describe, expect, it } from "vitest";
import {
  checkSendBudget,
  formatCountdown,
  readCooldownSeconds,
  recordSend,
  retryDelaySeconds,
  startCooldown,
  type StorageLike,
} from "./cooldown";

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const throwingStorage: StorageLike = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
  removeItem() {
    throw new Error("blocked");
  },
};

describe("retryDelaySeconds", () => {
  it.each([
    [{ code: "over_email_send_rate_limit" }, 300],
    [{ message: "email rate limit exceeded" }, 300],
    [{ code: "over_request_rate_limit" }, 60],
    [{ status: 429 }, 60],
    [{ message: "Too many requests" }, 60],
    [{ message: "For security purposes, you can only request this after 52 seconds." }, 53],
    [{ status: 429, message: "you can only request this after 1 second." }, 2],
  ])("%j waits %i seconds", (error, seconds) => {
    expect(retryDelaySeconds(error)).toBe(seconds);
  });

  it.each([[null], [undefined], [{ code: "invalid_credentials" }], [{ message: "boom" }]])(
    "returns null for %j (not a rate limit)",
    (error) => {
      expect(retryDelaySeconds(error)).toBeNull();
    },
  );

  it("never asks for more than an hour", () => {
    expect(retryDelaySeconds({ message: "after 999999 seconds" })).toBe(3_600);
  });
});

describe("cooldown storage", () => {
  it("remembers a cooldown and counts it down in whole seconds", () => {
    const storage = memoryStorage();
    startCooldown(storage, "k", 60, 1_000_000);
    expect(readCooldownSeconds(storage, "k", 1_000_000)).toBe(60);
    expect(readCooldownSeconds(storage, "k", 1_000_000 + 30_500)).toBe(30);
    expect(readCooldownSeconds(storage, "k", 1_000_000 + 59_999)).toBe(1);
  });

  it("clears itself when finished", () => {
    const storage = memoryStorage();
    startCooldown(storage, "k", 5, 0);
    expect(readCooldownSeconds(storage, "k", 5_001)).toBe(0);
    expect(storage.data.has("k")).toBe(false);
  });

  it("treats junk and missing values as no cooldown", () => {
    const storage = memoryStorage();
    expect(readCooldownSeconds(storage, "missing", 0)).toBe(0);
    storage.setItem("k", "not-a-number");
    expect(readCooldownSeconds(storage, "k", 0)).toBe(0);
  });

  it("copes with blocked storage without throwing", () => {
    expect(() => startCooldown(throwingStorage, "k", 60)).not.toThrow();
    expect(readCooldownSeconds(throwingStorage, "k")).toBe(0);
  });
});

describe("email send budget", () => {
  const WINDOW = 10 * 60_000;

  it("allows up to the maximum, then says how long until the oldest ages out", () => {
    const storage = memoryStorage();
    const t0 = 5_000_000;
    for (let i = 0; i < 3; i += 1) {
      expect(checkSendBudget(storage, "s", 3, WINDOW, t0 + i * 1_000)).toEqual({ allowed: true });
      recordSend(storage, "s", WINDOW, t0 + i * 1_000);
    }
    const blocked = checkSendBudget(storage, "s", 3, WINDOW, t0 + 10_000);
    expect(blocked).toEqual({ allowed: false, retryAfterSeconds: 590 });
  });

  it("allows again once the window has passed", () => {
    const storage = memoryStorage();
    for (let i = 0; i < 3; i += 1) recordSend(storage, "s", WINDOW, 0);
    expect(checkSendBudget(storage, "s", 3, WINDOW, WINDOW + 1)).toEqual({ allowed: true });
  });

  it("ignores corrupt stored data and blocked storage", () => {
    const storage = memoryStorage();
    storage.setItem("s", "{not json");
    expect(checkSendBudget(storage, "s", 3, WINDOW, 0)).toEqual({ allowed: true });
    expect(checkSendBudget(throwingStorage, "s", 3, WINDOW, 0)).toEqual({ allowed: true });
  });
});

describe("formatCountdown", () => {
  it.each([
    [0, "0:00"],
    [9, "0:09"],
    [60, "1:00"],
    [300, "5:00"],
    [3_599, "59:59"],
  ])("%i seconds is %s", (seconds, text) => {
    expect(formatCountdown(seconds)).toBe(text);
  });
});
