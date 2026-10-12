"use client";

import type { OutfitAnalysis, StyledImage } from "@/lib/fix-my-style/schema";
import { itemCategoryLabels } from "@/lib/fix-my-style/schema";

export const primaryButton =
  "inline-flex min-h-12 items-center justify-center px-6 text-center text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 bg-espresso text-ivory hover:bg-stone disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton =
  "inline-flex min-h-12 items-center justify-center px-6 text-center text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 border border-espresso/30 text-espresso hover:border-espresso hover:bg-espresso/5 disabled:cursor-not-allowed disabled:opacity-50";

// One address per photo, created on first use and reused on every render.
const urls = new WeakMap<Blob, string>();
export function photoUrl(blob: Blob): string {
  let url = urls.get(blob);
  if (!url) {
    url = URL.createObjectURL(blob);
    urls.set(blob, url);
  }
  return url;
}
export function releasePhoto(blob: Blob) {
  const url = urls.get(blob);
  if (url) {
    URL.revokeObjectURL(url);
    urls.delete(blob);
  }
}

export type ImageState =
  | { state: "pending" }
  | { state: "ready"; blob: Blob }
  | { state: "unavailable"; kind: Exclude<StyledImage["status"], "generated">; message: string };

const progressSteps = ["Understanding your outfit", "Exploring combinations", "Preparing your look"];

/*
  Shown only while a request is running. It is a waiting animation, not a result:
  it is never shown after a request ends, and it says nothing was generated yet.
*/
export function StylingProgress({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 text-center ${compact ? "p-4" : "h-full p-6"}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className="h-16 w-16 animate-pulse text-taupe motion-reduce:animate-none"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M32 14a5 5 0 1 0-5-5" />
        <path d="M32 14v6l24 17a3 3 0 0 1-1.800 5.400H9.800A3 3 0 0 1 8 37z" />
      </svg>

      {/* Three captions take turns. Reduced motion shows one still line instead. */}
      <div className="relative h-8 w-full motion-reduce:hidden">
        {progressSteps.map((step, index) => (
          <p
            key={step}
            className="progress-step absolute inset-0 font-display text-2xl leading-8"
            style={{ animationDelay: `${index * 2.2}s` }}
          >
            {step}…
          </p>
        ))}
      </div>
      <p className="hidden font-display text-2xl leading-8 motion-reduce:block">Working on your look…</p>

      <p className="text-sm text-stone">Nothing has been generated yet. This can take up to a minute.</p>
    </div>
  );
}

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure>
      <figcaption className="mb-2 text-xs uppercase tracking-[0.22em] text-stone">{label}</figcaption>
      <div className="aspect-[4/5] w-full overflow-hidden border border-sand bg-sand">{children}</div>
    </figure>
  );
}

// Original and styled look, stacked on phones and side by side from md up.
export function Comparison({
  original,
  image,
  onRetry,
}: {
  original: Blob;
  image: ImageState;
  onRetry?: () => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-6">
      <Frame label="Original Outfit">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl(original)} alt="Your original outfit" className="h-full w-full object-cover" />
      </Frame>

      <Frame label="Your Styled Look">
        {image.state === "ready" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl(image.blob)}
            alt="AI-generated version of your outfit with improved styling"
            className="h-full w-full object-cover"
          />
        )}
        {image.state === "pending" && <StylingProgress />}
        {image.state === "unavailable" && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="font-display text-2xl leading-7">
              {image.kind === "failed"
                ? "The image didn’t come through."
                : image.kind === "skipped"
                  ? "No styled image."
                  : image.kind === "unavailable"
                    ? "Image styling isn’t available yet."
                    : "Image styling isn’t on yet."}
            </p>
            <p className="text-sm leading-6 text-stone">{image.message}</p>
            {onRetry && (image.kind === "failed" || image.kind === "unavailable") && (
              <button type="button" onClick={onRetry} className={`${secondaryButton} mt-2`}>
                Retry
              </button>
            )}
          </div>
        )}
      </Frame>
    </div>
  );
}

// Written advice. It is styling guidance only: no products, prices or links.
export function Advice({ analysis }: { analysis: OutfitAnalysis }) {
  return (
    <div className="space-y-10">
      <section aria-labelledby="advice-heading">
        <h2 id="advice-heading" className="font-display text-3xl leading-tight">
          What we noticed
        </h2>
        <p className="mt-3 max-w-2xl leading-7">{analysis.assessment}</p>
        {analysis.improvements.length > 0 && (
          <ul className="mt-4 max-w-2xl list-disc space-y-2 pl-5 leading-7 text-stone">
            {analysis.improvements.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="complete-heading" className="border-t border-sand pt-8">
        <h2 id="complete-heading" className="font-display text-3xl leading-tight">
          Complete Your Look
        </h2>
        <p className="mt-2 text-stone">Small additions can make your outfit feel even more put together.</p>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-xs uppercase tracking-[0.22em] text-stone">Already in your outfit</h3>
            {analysis.items.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {analysis.items.map((item) => (
                  <li key={`${item.name}-${item.category}`} className="border border-sand bg-soft-white p-4">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-stone">
                      {itemCategoryLabels[item.category]}
                      {item.colours.length > 0 ? ` · ${item.colours.join(", ")}` : ""}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-stone">{item.details}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone">No individual pieces could be picked out.</p>
            )}
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.22em] text-stone">Consider adding</h3>
            {analysis.additions.length > 0 ? (
              <>
                <ul className="mt-3 space-y-3">
                  {analysis.additions.map((item) => (
                    <li key={`${item.name}-${item.category}`} className="border border-dashed border-espresso/40 p-4">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-stone">{itemCategoryLabels[item.category]} · not owned yet</p>
                      <p className="mt-1 text-sm leading-6">{item.why}</p>
                      <p className="mt-1 text-sm leading-6 text-stone">Tip: {item.tip}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-5 text-stone">
                  These are styling ideas, not products. Matching products will appear once the
                  VEYORAQ catalogue is connected.
                </p>
              </>
            ) : (
              <p className="mt-3 border border-sand bg-soft-white p-4 text-sm leading-6">
                Your outfit already feels complete, so there&rsquo;s nothing you need to add.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
