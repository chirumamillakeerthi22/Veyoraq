import type { Metadata } from "next";
import { Suspense } from "react";
import { DeleteSavedButton } from "@/components/saved/delete-saved-button";
import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";
import { OutfitCard } from "@/components/stylist/outfit-card";
import {
  SAVED_LIMIT,
  TABLE,
  friendlySaveError,
  parseSavedRows,
} from "@/lib/saved/saved-outfits";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Saved Styles",
  description: "The outfit ideas you have saved.",
};

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="max-w-md leading-7 text-stone">{children}</p>;
}

// Reads the signed-in visitor's own rows. Row Level Security in the database means
// this can only ever return the current user's outfits.
async function SavedContent() {
  if (!getSupabaseConfig().ok) {
    return <Notice>Saved Styles isn&rsquo;t available yet. Please check back soon.</Notice>;
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return (
      <div className="max-w-md">
        <Notice>Sign in to see the looks you have saved.</Notice>
        <div className="mt-6">
          <ButtonLink href="/account">Sign in</ButtonLink>
        </div>
      </div>
    );
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, outfit, created_at")
    .order("created_at", { ascending: false })
    .limit(SAVED_LIMIT);

  if (error) {
    return <Notice>{friendlySaveError(error)}</Notice>;
  }

  const saved = parseSavedRows(data);

  if (saved.length === 0) {
    return (
      <div className="max-w-md">
        <Notice>Nothing saved yet. Create some ideas and press &ldquo;Save this look&rdquo;.</Notice>
        <div className="mt-6">
          <ButtonLink href="/stylist">Discover my style</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <ol className="grid gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {saved.map((item) => (
        <li key={item.id}>
          <OutfitCard outfit={item.outfit}>
            <DeleteSavedButton id={item.id} />
          </OutfitCard>
        </li>
      ))}
    </ol>
  );
}

export default function SavedPage() {
  return (
    <Container className="py-12 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">Saved Styles</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">
          Your saved <em>looks.</em>
        </h1>
      </div>
      <div className="mt-10">
        <Suspense fallback={<p className="text-stone">Loading…</p>}>
          <SavedContent />
        </Suspense>
      </div>
    </Container>
  );
}
