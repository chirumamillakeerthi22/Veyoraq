import type { Audience } from "@/lib/audience";
import {
  colourAnalysisHref,
  fitGuidanceHref,
  fixMyStyleHref,
  hairStudioHref,
  journalHref,
  stylistHref,
  type NavIcon,
} from "@/lib/navigation";
import type { PhotoName } from "@/lib/photos";

/*
  The services shown on Explore. Each has a cover photo for each audience, so one
  audience's photography never stands in for the other's. Fit Guidance uses a
  neutral photo of a measuring tape, which shows no person.
*/

export type ExploreService = {
  name: string;
  text: string;
  icon: NavIcon;
  href: string;
  status: "available" | "preview";
  cover: Record<Audience, PhotoName>;
  // Text that differs by audience, when it does.
  textFor?: Partial<Record<Audience, string>>;
};

export const exploreServices: ExploreService[] = [
  {
    name: "Discover Your Style",
    text: "A short quiz that turns your taste, colours and occasions into outfit ideas.",
    icon: "discover",
    href: stylistHref,
    status: "available",
    cover: { women: "everyday", men: "menEveryday" },
  },
  {
    name: "Color Analysis",
    text: "Estimate your likely colour season and get a personal palette from a photo and a short quiz.",
    icon: "discover",
    href: colourAnalysisHref,
    status: "available",
    cover: { women: "colour", men: "menJournalColour" },
  },
  {
    name: "Hair Studio",
    text: "Upload a photo, answer a short quiz, and preview four new hairstyles on your own photo.",
    textFor: {
      men: "Upload a photo, answer a short quiz, and preview four new haircuts and styles on your own photo.",
    },
    icon: "hair",
    href: hairStudioHref,
    status: "available",
    cover: { women: "hair", men: "menHair" },
  },
  {
    name: "FIX My Style",
    text: "Upload a photo of your outfit and see better ways to wear what you already own.",
    icon: "fix",
    href: fixMyStyleHref,
    status: "available",
    cover: { women: "flatLay", men: "menFlatLay" },
  },
  {
    name: "Fit Guidance",
    text: "Find cuts, proportions and silhouettes you may enjoy, based on what you choose to share.",
    icon: "fix",
    href: fitGuidanceHref,
    status: "available",
    cover: { women: "fitTape", men: "fitTape" },
  },
  {
    name: "Style Journal",
    text: "Search real articles from fashion publishers on colour, fit, workwear, occasions and more.",
    icon: "journal",
    href: journalHref,
    status: "available",
    cover: { women: "journalTexture", men: "menJournalTexture" },
  },
];

export const statusLabel: Record<ExploreService["status"], string> = {
  available: "Available",
  preview: "Preview",
};
