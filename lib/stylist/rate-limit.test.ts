import { describe, expect, it } from "vitest";
import {
  clientKey,
  createRateLimiter,
  describeWait,
} from "./rate-limit";

function clock(start = 1_000_000) {
  let time = start;
  return {
    now: () => time,
    advance: (ms: number) => {
      time += ms;
    },
  };
}

describe("createRateLimiter", () => {
  it("allows up to the maximum, then refuses with a wait time", () => {
    const c = clock();
    const limiter = createRateLimiter({
      rules: [{ windowMs: 60_000, max: 3 }],
      now: c.now,
    });

    expect(limiter.check("a")).toEqual({ allowed: true });
    c.advance(1_000);
    expect(limiter.check("a")).toEqual({ allowed: true });
    c.advance(1_000);
    expect(limiter.check("a")).toEqual({ allowed: true });
    c.advance(1_000);

    // Oldest request was 3 s ago, so a slot frees in 57 s.
    expect(limiter.check("a")).toEqual({
      allowed: false,
      retryAfterSeconds: 57,
    });
  });

  it("lets the visitor back in once the window has passed", () => {
    const c = clock();
    const limiter = createRateLimiter({
      rules: [{ windowMs: 10_000, max: 1 }],
      now: c.now,
    });
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
    c.advance(10_001);
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("does not let refused requests extend the wait", () => {
    const c = clock();
    const limiter = createRateLimiter({
      rules: [{ windowMs: 10_000, max: 1 }],
      now: c.now,
    });
    limiter.check("a");
    for (let i = 0; i < 20; i += 1) {
      c.advance(400);
      limiter.check("a"); // refused each time
    }
    c.advance(2_100); // 10.1 s since the one allowed request
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("tracks visitors separately", () => {
    const limiter = createRateLimiter({ rules: [{ windowMs: 60_000, max: 1 }] });
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
  });

  it("enforces a longer rule after a shorter one has reset", () => {
    const c = clock();
    const limiter = createRateLimiter({
      rules: [
        { windowMs: 1_000, max: 2 },
        { windowMs: 10_000, max: 3 },
      ],
      now: c.now,
    });
    limiter.check("a");
    limiter.check("a");
    c.advance(1_001); // short window clear
    expect(limiter.check("a").allowed).toBe(true); // third in 10 s
    c.advance(1_001);
    const result = limiter.check("a"); // short window clear, long one full
    expect(result.allowed).toBe(false);
    // The first request leaves the 10 s window 10 s after it was made (about 7.9 s from now).
    expect(result).toMatchObject({ retryAfterSeconds: 8 });
  });

  it("keeps memory bounded by evicting the least recently used visitors", () => {
    const limiter = createRateLimiter({
      rules: [{ windowMs: 60_000, max: 1 }],
      maxKeys: 3,
    });
    ["a", "b", "c", "d", "e"].forEach((key) => limiter.check(key));
    expect(limiter.size()).toBeLessThanOrEqual(3);
    // "a" was evicted, so it starts fresh.
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("reset clears everything", () => {
    const limiter = createRateLimiter({ rules: [{ windowMs: 60_000, max: 1 }] });
    limiter.check("a");
    limiter.reset();
    expect(limiter.size()).toBe(0);
    expect(limiter.check("a").allowed).toBe(true);
  });
});

describe("clientKey", () => {
  const req = (headers: Record<string, string>) =>
    new Request("https://x.test", { headers });

  it("prefers the Vercel header and takes the first address", () => {
    expect(
      clientKey(
        req({
          "x-vercel-forwarded-for": "203.0.113.7, 10.0.0.1",
          "x-forwarded-for": "198.51.100.9",
        }),
      ),
    ).toBe("203.0.113.7");
  });

  it("falls back through the other headers", () => {
    expect(clientKey(req({ "x-forwarded-for": "198.51.100.9" }))).toBe(
      "198.51.100.9",
    );
    expect(clientKey(req({ "x-real-ip": "192.0.2.4" }))).toBe("192.0.2.4");
  });

  it("uses a shared bucket when no address is available or it looks wrong", () => {
    expect(clientKey(req({}))).toBe("unknown");
    expect(clientKey(req({ "x-forwarded-for": "x".repeat(200) }))).toBe(
      "unknown",
    );
  });
});

describe("describeWait", () => {
  it.each([
    [10, "a minute"],
    [89, "a minute"],
    [300, "5 minutes"],
    [3_599, "60 minutes"],
    [3_600, "an hour"],
    [7_300, "3 hours"],
  ])("%i seconds is %s", (seconds, text) => {
    expect(describeWait(seconds)).toBe(text);
  });
});
