"use client";

import { ButtonLink } from "@/components/button-link";
import { SavedCard } from "@/components/saved/saved-card";
import { savedStore, useSavedOutfits } from "@/lib/saved/use-saved";

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="max-w-md leading-7 text-stone">{children}</p>;
}

/*
  The signed-in visitor's saved looks. Everything comes from the shared saved-looks
  store, which reads the database as the signed-in user, so Row Level Security means
  only their own looks can ever appear here.
*/
export function SavedList() {
  const state = useSavedOutfits();

  if (state.status === "idle" || state.status === "loading") {
    return <p className="text-stone">Loading your saved looks…</p>;
  }

  if (state.status === "signed-out") {
    return (
      <div className="max-w-md">
        <Notice>Sign in to see the looks you have saved. They are private to your account.</Notice>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/account">Sign in</ButtonLink>
          <ButtonLink href="/account?mode=signup" variant="secondary">
            Create account
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (state.status === "unavailable") {
    return <Notice>Saved Styles isn&rsquo;t available yet. Please check back soon.</Notice>;
  }

  if (state.status === "error" && state.items.length === 0) {
    return (
      <div className="max-w-md">
        <Notice>{state.message ?? "We couldn't load your saved looks."}</Notice>
        <button
          type="button"
          onClick={() => void savedStore.refresh()}
          className="mt-4 min-h-11 underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="max-w-md">
        <Notice>
          Nothing saved yet. Create some ideas in Discover Your Style and press
          &ldquo;Save this look&rdquo;.
        </Notice>
        <div className="mt-6">
          <ButtonLink href="/stylist">Discover your style</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div>
      {state.status === "error" && state.message && (
        <p role="alert" className="mb-6 max-w-md text-sm">
          {state.message}
        </p>
      )}
      {/* Two columns on phones (one only on exceptionally narrow screens), more on larger. */}
      <ol className="grid grid-cols-2 gap-x-3 gap-y-8 max-[340px]:grid-cols-1 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
        {state.items.map((item) => (
          <li key={item.id}>
            <SavedCard item={item} />
          </li>
        ))}
      </ol>
    </div>
  );
}
