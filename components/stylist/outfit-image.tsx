"use client";

import { useState } from "react";
import type { Outfit } from "@/lib/stylist/schema";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; src: string }
  | { kind: "unavailable"; message: string }
  | { kind: "error"; message: string };

/*
  Creates one picture for an outfit concept, only when the person asks. It is only
  rendered when image generation is switched on, so it never offers something the
  site cannot deliver. A generated picture is labelled as such and may differ from
  the written description.
*/
export function OutfitImage({ outfit }: { outfit: Outfit }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function create() {
    setState({ kind: "loading" });
    try {
      const response = await fetch("/api/stylist/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfit }),
        signal: AbortSignal.timeout(65_000),
      });
      const data = (await response.json().catch(() => null)) as {
        status?: string;
        mimeType?: string;
        data?: string;
        message?: string;
        error?: { message?: string };
      } | null;

      if (!response.ok) {
        return setState({
          kind: "error",
          message: data?.error?.message ?? "We couldn't create an image just now. Please try again.",
        });
      }
      if (data?.status === "generated" && data.mimeType && data.data) {
        return setState({ kind: "ready", src: `data:${data.mimeType};base64,${data.data}` });
      }
      setState({
        kind: data?.status === "failed" ? "error" : "unavailable",
        message: data?.message ?? "AI images aren't available right now.",
      });
    } catch {
      setState({ kind: "error", message: "We couldn't reach the image service. Check your connection and try again." });
    }
  }

  return (
    <div className="mt-3">
      {state.kind === "ready" ? (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={state.src} alt={`AI-generated image of the outfit ${outfit.name}`} className="w-full border border-sand" />
          <figcaption className="mt-1 text-xs leading-5 text-stone">
            AI-generated image of this concept. Details may differ from the description.
          </figcaption>
        </figure>
      ) : (
        <>
          <button
            type="button"
            disabled={state.kind === "loading"}
            onClick={create}
            className="inline-flex min-h-11 items-center justify-center border border-espresso/30 px-5 text-[0.75rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 hover:border-espresso hover:bg-espresso/5 disabled:opacity-60"
          >
            {state.kind === "loading" ? "Creating image…" : state.kind === "error" ? "Try again" : "Create image"}
          </button>
          {state.kind === "loading" && (
            <p role="status" className="mt-2 text-xs text-stone">
              This can take up to a minute.
            </p>
          )}
          {(state.kind === "error" || state.kind === "unavailable") && (
            <p role="alert" className="mt-2 text-xs leading-5">
              {state.message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
