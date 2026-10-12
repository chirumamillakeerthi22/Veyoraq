import { describe, expect, it } from "vitest";
import { isShoppable, type Product } from "./product";

const base: Product = {
  id: "p1",
  name: "Linen shirt",
  retailer: "Example Store",
  imageUrl: null,
  url: "https://shop.example/linen-shirt",
  price: { amount: 1999, currency: "INR" },
  checkedAt: "2026-10-12",
};

describe("isShoppable", () => {
  it("accepts a complete record", () => {
    expect(isShoppable(base)).toBe(true);
  });

  it("rejects a record without a destination or a price", () => {
    expect(isShoppable({ ...base, url: null })).toBe(false);
    expect(isShoppable({ ...base, price: null })).toBe(false);
  });

  it("rejects insecure and malformed addresses", () => {
    expect(isShoppable({ ...base, url: "http://shop.example/x" })).toBe(false);
    expect(isShoppable({ ...base, url: "not a url" })).toBe(false);
    expect(isShoppable({ ...base, url: "javascript:alert(1)" })).toBe(false);
  });
});
