import type { Metadata } from "next";
import { Container } from "@/components/container";
import { SavedColourReports } from "@/components/saved/saved-colour-reports";
import { SavedFitReports } from "@/components/saved/saved-fit-reports";
import { SavedList } from "@/components/saved/saved-list";
import { SavedTabs } from "@/components/saved/saved-tabs";

export const metadata: Metadata = {
  title: "Saved Styles",
  description: "The outfit ideas you have saved.",
};

// The list itself is read in the browser from the shared saved-looks store, so that
// this page and every Save button always agree.
export default function SavedPage() {
  return (
    <Container className="py-12 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">Saved Styles</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          Your saved <em>looks.</em>
        </h1>
        <p className="mt-5 leading-7 text-stone">
          Complete outfits, Color Analysis reports and Fit Guidance you have saved. Individual items you want to buy live in your Wishlist.
        </p>
      </div>
      <div className="mt-10">
        <SavedTabs outfits={<SavedList />} colour={<SavedColourReports />} fit={<SavedFitReports />} />
      </div>
    </Container>
  );
}
