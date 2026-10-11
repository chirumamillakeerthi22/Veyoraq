import { describe, expect, it } from "vitest";
import { bottomNavLinks, collectionLinks, isActiveLink, navLinks } from "./navigation";

describe("isActiveLink", () => {
  it("marks a page link active on its own path and below it", () => {
    expect(isActiveLink("/stylist", "/stylist")).toBe(true);
    expect(isActiveLink("/saved", "/saved")).toBe(true);
    expect(isActiveLink("/stylist/results", "/stylist")).toBe(true);
  });

  it("does not mark a link active on a different or merely similar path", () => {
    expect(isActiveLink("/", "/stylist")).toBe(false);
    expect(isActiveLink("/saved-looks", "/saved")).toBe(false);
    expect(isActiveLink("/wishlist", "/saved")).toBe(false);
  });

  it("never marks homepage-section links, since the path cannot tell which is on screen", () => {
    expect(isActiveLink("/", "/#fix-my-style")).toBe(false);
  });

  it("keeps Explore current on the service pages that sit inside it", () => {
    const explore = navLinks[0];
    expect(isActiveLink("/stylist", explore.href, explore.activeUnder)).toBe(true);
    expect(isActiveLink("/fix-my-style", explore.href, explore.activeUnder)).toBe(true);
    expect(isActiveLink("/shop", explore.href, explore.activeUnder)).toBe(false);
  });
});

describe("navigation link data", () => {
  it("lists Explore and Shop as the main destinations, with no Home item", () => {
    expect(navLinks.map((link) => link.label)).toEqual(["Explore", "Shop"]);
    expect(navLinks.map((link) => link.href)).toEqual(["/explore", "/shop"]);
  });

  it("lists Saved and Wishlist, with the short label for Saved Styles", () => {
    expect(collectionLinks.map((link) => link.href)).toEqual(["/saved", "/wishlist"]);
    expect(collectionLinks[0].label).toBe("Saved Styles");
    expect(collectionLinks[0].shortLabel).toBe("Saved");
  });

  it("keeps the phone bottom bar to Home, Explore, Saved and Wishlist", () => {
    expect(bottomNavLinks.map((link) => link.href)).toEqual([
      "/",
      "/explore",
      "/saved",
      "/wishlist",
    ]);
  });

  it("marks Home current only on the homepage itself", () => {
    expect(isActiveLink("/", "/")).toBe(true);
    expect(isActiveLink("/saved", "/")).toBe(false);
    expect(isActiveLink("/stylist", "/")).toBe(false);
  });
});
