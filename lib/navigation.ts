export type NavIcon =
  | "home"
  | "discover"
  | "fix"
  | "hair"
  | "journal"
  | "shop"
  | "saved"
  | "wishlist";

export type NavLink = {
  label: string;
  // The compact label used in the top bar, when it differs from the full name.
  shortLabel?: string;
  href: string;
  icon: NavIcon;
  // Other paths that belong under this destination, so it stays marked as current.
  activeUnder?: string[];
};

// Pages that exist only as clearly marked "coming soon" placeholders.
export const stylistHref = "/stylist";
export const fixMyStyleHref = "/fix-my-style";
export const accountHref = "/account";

// The directory of styling services, and product discovery.
export const exploreHref = "/explore";
export const shopHref = "/shop";

// The visitor's own collection: two different things. Saved Styles holds complete
// outfits; Wishlist holds individual products they may want to buy.
export const savedHref = "/saved";
export const wishlistHref = "/wishlist";
export const settingsHref = "/account/settings";
export const signUpHref = "/account?mode=signup";

export const collectionLinks: NavLink[] = [
  { label: "Saved Styles", shortLabel: "Saved", href: savedHref, icon: "saved" },
  { label: "Wishlist", href: wishlistHref, icon: "wishlist" },
];

// The logo is the way home, so there is no separate Home item.
export const navLinks: NavLink[] = [
  {
    label: "Explore",
    href: exploreHref,
    icon: "discover",
    activeUnder: [stylistHref, fixMyStyleHref],
  },
  { label: "Shop", href: shopHref, icon: "shop" },
];

// The fixed bottom bar on phones. Shop stays reachable from the header icon and
// from Explore, so the bar keeps to four destinations.
export const bottomNavLinks: NavLink[] = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Explore", href: exploreHref, icon: "discover", activeUnder: [stylistHref, fixMyStyleHref] },
  collectionLinks[0],
  collectionLinks[1],
];

/*
  Whether a navigation link points at the page being viewed. Links that jump to a
  section of the homepage ("/#...") are never marked, because the path alone
  cannot say which section is on screen. "alsoUnder" lists further paths that
  count as being inside this destination.
*/
export function isActiveLink(pathname: string, href: string, alsoUnder: string[] = []): boolean {
  if (href.includes("#") || href.includes("?")) return false;
  return [href, ...alsoUnder].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

// Footer entries without an href are not built yet and are shown as "Soon".
export const footerGroups: {
  title: string;
  links: { label: string; href?: string }[];
}[] = [
  {
    title: "Explore",
    links: [
      { label: "All services", href: exploreHref },
      { label: "Discover Your Style", href: stylistHref },
      { label: "Style Journal", href: "/#style-journal" },
      { label: "Shop", href: shopHref },
    ],
  },
  {
    title: "Your style",
    links: [
      { label: "Saved Styles", href: "/saved" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About" },
      { label: "Contact" },
      { label: "Privacy" },
      { label: "Terms" },
    ],
  },
];
