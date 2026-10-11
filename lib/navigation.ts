export type NavLink = {
  label: string;
  href: string;
};

// Pages that exist only as clearly marked "coming soon" placeholders.
export const stylistHref = "/stylist";
export const fixMyStyleHref = "/fix-my-style";
export const accountHref = "/account";

// The visitor's own collection: two different things. Saved Styles holds complete
// outfits; Wishlist holds individual items they may want to buy.
export const savedHref = "/saved";
export const wishlistHref = "/wishlist";
export const settingsHref = "/account/settings";
export const signUpHref = "/account?mode=signup";

export const collectionLinks: NavLink[] = [
  { label: "Saved Styles", href: savedHref },
  { label: "Wishlist", href: wishlistHref },
];

// Section links start with "/" so they also work from pages other than the homepage.
export const navLinks: NavLink[] = [
  { label: "Discover Your Style", href: stylistHref },
  { label: "FIX My Style", href: "/#fix-my-style" },
  { label: "Hair Studio", href: "/#hair-studio" },
  { label: "Style Journal", href: "/#style-journal" },
  { label: "Shop Your Style", href: "/#shop-your-style" },
];

// Footer entries without an href are not built yet and are shown as "Soon".
export const footerGroups: {
  title: string;
  links: { label: string; href?: string }[];
}[] = [
  {
    title: "Explore",
    links: [
      { label: "Discover", href: "/#features" },
      { label: "FIX My Style", href: "/#fix-my-style" },
      { label: "Style Journal", href: "/#style-journal" },
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
