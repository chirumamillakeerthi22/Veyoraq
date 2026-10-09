export type NavLink = {
  label: string;
  href: string;
};

// Section links start with "/" so they also work from pages other than the homepage.
export const navLinks: NavLink[] = [
  { label: "Discover", href: "/#discover" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Style Journal", href: "/#style-journal" },
];

// The styling questionnaire is not built yet; this route is a clearly marked placeholder.
export const stylistHref = "/stylist";
