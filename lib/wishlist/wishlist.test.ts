import { describe, expect, it } from "vitest";
import {
  formatPrice,
  friendlyWishlistError,
  parseWishlistRows,
  safeHttpsUrl,
} from "./wishlist";

describe("safeHttpsUrl", () => {
  it.each([
    ["https://shop.example/p/1", "https://shop.example/p/1"],
    ["https://shop.example", "https://shop.example/"],
  ])("accepts %s", (input, expected) => {
    expect(safeHttpsUrl(input)).toBe(expected);
  });

  it.each([
    ["http://shop.example/p/1"],
    ["javascript:alert(1)"],
    ["data:text/html,<script>alert(1)</script>"],
    ["//shop.example"],
    ["not a url"],
    [""],
    [null],
    [42],
  ])("rejects %j", (input) => {
    expect(safeHttpsUrl(input)).toBeNull();
  });
});

describe("parseWishlistRows", () => {
  const row = (overrides: Record<string, unknown> = {}) => ({
    id: "w1",
    name: "Linen shirt",
    image_url: "https://img.example/1.jpg",
    price_amount: 1999,
    price_currency: "inr",
    retailer: "Example Store",
    product_url: "https://shop.example/p/1",
    created_at: "2026-10-12T10:00:00Z",
    ...overrides,
  });

  it("returns what is known, with the currency upper-cased", () => {
    expect(parseWishlistRows([row()])).toEqual([
      {
        id: "w1",
        name: "Linen shirt",
        imageUrl: "https://img.example/1.jpg",
        priceAmount: 1999,
        priceCurrency: "INR",
        retailer: "Example Store",
        productUrl: "https://shop.example/p/1",
        createdAt: "2026-10-12T10:00:00Z",
        audience: null,
      },
    ]);
  });

  it("reads a valid audience and treats anything else as not recorded", () => {
    expect(parseWishlistRows([row({ audience: "men" })])[0].audience).toBe("men");
    expect(parseWishlistRows([row({ audience: "women" })])[0].audience).toBe("women");
    expect(parseWishlistRows([row({ audience: "kids" })])[0].audience).toBeNull();
    expect(parseWishlistRows([row()])[0].audience).toBeNull();
  });

  it("accepts a price that arrives as text, as Postgres numeric does", () => {
    expect(parseWishlistRows([row({ price_amount: "1999.50" })])[0].priceAmount).toBe(1999.5);
  });

  it("shows no price unless both the amount and the currency are known", () => {
    const [noCurrency] = parseWishlistRows([row({ price_currency: null })]);
    expect(noCurrency.priceAmount).toBeNull();
    expect(noCurrency.priceCurrency).toBeNull();
    const [noAmount] = parseWishlistRows([row({ price_amount: null })]);
    expect(noAmount.priceAmount).toBeNull();
  });

  it("drops unsafe image and product addresses but keeps the item", () => {
    const [item] = parseWishlistRows([
      row({ image_url: "http://insecure.example/a.jpg", product_url: "javascript:alert(1)" }),
    ]);
    expect(item.imageUrl).toBeNull();
    expect(item.productUrl).toBeNull();
    expect(item.name).toBe("Linen shirt");
  });

  it("skips rows without an id or a name, and non-array input", () => {
    expect(parseWishlistRows([row({ id: 5 }), row({ name: "  " }), null, "x"])).toEqual([]);
    expect(parseWishlistRows(null)).toEqual([]);
    expect(parseWishlistRows({})).toEqual([]);
  });
});

describe("formatPrice", () => {
  it("formats rupees and falls back safely for an unknown currency code", () => {
    expect(formatPrice(1999, "INR")).toMatch(/1,999/);
    expect(formatPrice(10, "ZZZ")).toBeTruthy();
  });
});

describe("friendlyWishlistError", () => {
  it("says the wishlist is unavailable while the table does not exist", () => {
    expect(friendlyWishlistError({ code: "PGRST205" })).toMatchObject({ unavailable: true });
  });

  it("asks for sign-in on a permission error, and is generic otherwise", () => {
    expect(friendlyWishlistError({ code: "42501" }).message).toMatch(/sign in/i);
    const generic = friendlyWishlistError({ code: "XX000", message: "internal table detail" });
    expect(generic.unavailable).toBe(false);
    expect(generic.message).not.toContain("internal");
  });
});
