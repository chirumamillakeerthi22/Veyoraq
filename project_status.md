
# VEYORAQ — Project Status

Last updated: 2026-10-09

## 1. Project Identity

Name: VEYORAQ
Tagline: Style, decoded.
Product: AI-powered personal stylist and fashion discovery platform.
Initial target market: India.

## 2. Confirmed Environment Information

- Project folder: D:\Projects\VEYORAQ
- Operating system: Windows
- Node.js v24.18.0 (VERIFIED with `node -v` on 2026-10-09).
- npm 11.19.0 (VERIFIED with `npm -v` on 2026-10-09).
- VS Code is being used for development (reported by the owner).

Recheck the versions if the environment changes.

### Installed dependency versions (VERIFIED with `npm ls --depth=0`)

- next 16.4.0
- react 19.3.0, react-dom 19.3.0
- typescript 5.9.3
- tailwindcss 4.3.3, @tailwindcss/turbopack 4.3.3
- eslint 9.39.5, eslint-config-next 16.4.0
- @types/react 19.3.0, @types/react-dom 19.3.0
- zod 4.6.5 (added 2026-10-10 for request and AI-output validation)
- @types/node 24.19.2 (raised from ^20 to match Node 24 and satisfy vitest's peer dependency; types only)
- vitest 5.0.3 (dev only, added 2026-10-10)

### Project structure (VERIFIED 2026-10-09; Discover Your Style files added 2026-10-10)

Application code:
- `app/layout.tsx` — root layout: fonts, metadata (including social-sharing tags), skip link, shared header and footer.
- `app/page.tsx` — VEYORAQ homepage.
- `app/stylist/page.tsx` — Discover Your Style page (questionnaire and results).
- `app/api/stylist/route.ts` — POST endpoint: same-origin check, size limit, input validation, then the generator.
- `app/fix-my-style/page.tsx`, `app/account/page.tsx` — "coming soon" placeholders. None of these features exists.
- `lib/stylist/` — `options.ts` (choices shared by form, schema and prompt), `schema.ts` (zod input and output contracts), `prompt.ts`, `generate.ts` (server-side Gemini `generateContent` call and validation), `fixtures.ts` and `*.test.ts` (tests).
- `components/stylist/` — `stylist-flow.tsx` (client component: form, loading, error, results), `choice.tsx`, `outfit-results.tsx`.
- `app/globals.css` — Tailwind import, colour and font tokens, focus and reduced-motion rules.
- `components/` — `site-header.tsx`, `mobile-nav.tsx` (the only client component), `site-footer.tsx`, `button-link.tsx`, `container.tsx`, `photo.tsx`, `coming-soon.tsx`.
- `lib/brand.ts` — brand name, tagline and description in one place.
- `lib/navigation.ts` — navigation and footer links.
- `lib/photos.ts` — the photographs used, with their Unsplash sources.
- `app/favicon.ico`, `public/*.svg` — default template assets, now unused by the pages but left in place.

Configuration:
- `package.json`, `package-lock.json` — scripts: `dev`, `build`, `start`, `lint`, `test`.
- `vitest.config.mts` — test runner config with the `@` path alias.
- `.env.example` — placeholders for `GEMINI_API_KEY`, `GEMINI_MODEL` (optional) and the two Supabase public variables. Real values go in `.env.local` (git-ignored) and in Vercel's environment variables.
- `next.config.ts` — Tailwind loaded through the Turbopack loader; `cacheComponents`, `partialPrefetching` and experimental `agentFeedback` enabled; remote images allowed from `images.unsplash.com/photo-*` only.
- `tsconfig.json` — strict TypeScript, `@/*` path alias to the project root.
- `eslint.config.mjs` — Next.js core-web-vitals and TypeScript rules.
- `.gitignore` — ignores `node_modules`, `.next`, `.env*` (except `.env.example`), `next-env.d.ts`, `*.tsbuildinfo`.
- `.claude/launch.json` — valid JSON; tells the Claude preview pane to run `npm run dev` on port 3000. Not used by Next.js itself. This is not a VS Code `.vscode/launch.json`; none exists.

Documentation: `AGENTS.md`, `claude.md`, `BUILD_GUIDE.md`, `README.md`, `project_status.md`. There is no `MASTER_DEVELOPMENT_PROMPT.md` in the repository.

Generated, not committed: `node_modules/`, `.next/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`.

Present but not committed: `.env.local` (git-ignored; holds the Gemini key and the Supabase URL and publishable key). Not present: Supabase code or packages (the Supabase variables are unused so far), authentication, database, product catalogue.

## 3. Current Application Status

VERIFIED on 2026-10-09 (commands run from D:\Projects\VEYORAQ):

- The Next.js application is initialized in the project root (App Router, `app/` directory). At the time of these setup checks it was the unmodified create-next-app template; the homepage was built afterwards (see "Homepage" below).
- package.json exists. Installed: next 16.4.0, react 19.3.0, react-dom 19.3.0, TypeScript 5, Tailwind CSS 4 (via `@tailwindcss/turbopack`), ESLint 9.
- Node.js v24.18.0 and npm 11.19.0 confirmed by running `node -v` and `npm -v`.
- `npm run lint` — passed (exit code 0, no warnings).
- `npx tsc --noEmit` — passed (exit code 0).
- `npm run build` — passed; routes `/` and `/_not-found` prerendered as static.
- `npm run dev` — server ready on http://localhost:3000; `GET /` returned 200; the default page rendered in a browser with no console errors, at desktop width and at 375 px mobile width (no horizontal overflow).
- Git repository exists on branch `master`. Nothing has been pushed.
- `.claude/launch.json` was added so the dev server can be started from the Claude preview pane.
- Re-verified later on 2026-10-09: `npm run lint` and `npx tsc --noEmit` passed again, `http://localhost:3000` returned 200, the default page rendered with no browser console errors and no server errors in the dev log. `npm run build` was not re-run in this second pass.
- Unresolved errors: none.

The earlier ENOENT failure of `npm run dev` is INFERRED to have come from running the command outside the project root; it does not reproduce from D:\Projects\VEYORAQ.

Note: AGENTS.md warns that this Next.js version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing application code.

Do not describe VEYORAQ as a functioning product; only a static homepage and a placeholder page exist.

### Discover Your Style, Phase A (2026-10-10, branch `discover-your-style`, uncommitted, not deployed)

What exists: a one-page questionnaire at `/stylist` (occasion, up to 3 styles, up to 4 colour groups, budget tier plus currency, optional notes up to 300 characters) that posts to `/api/stylist`, which asks Google Gemini for up to three outfit concepts and shows them. Nothing is saved by VEYORAQ: there is no database, no login and no stored answers. (Provider switched from OpenAI to Gemini on 2026-10-10; the OpenAI code was replaced, not kept alongside.)

How it is kept honest:
- The AI output schema has no field for prices, brands, links or product IDs. Unknown fields are rejected, and text containing links, currency symbols or offers is rejected.
- The budget is a tier that only guides how simple or elevated the pieces are. The page says prices are not checked. No budget maths is done.
- The API key is read only on the server, from `GEMINI_API_KEY`, and sent in the `x-goog-api-key` header (never in the URL). The model comes from the optional `GEMINI_MODEL`, with `gemini-3.5-flash-lite` as the default set in `lib/stylist/generate.ts`.
- The call uses the `generateContent` endpoint with `responseMimeType` and `responseJsonSchema`, a 45 s timeout and an output-token cap. Failures map to friendly messages; the key is redacted from logs and never returned.

Verification (2026-10-10):
- `npm test` — 3 files, 44 tests passed: input and output schemas, the JSON schema sent to Gemini, the generator with `fetch` mocked (success, default model, thought parts ignored, blocked prompt, withheld answer, MAX_TOKENS, invalid output, no candidates, 429, 5xx, timeout, key redacted from logs), and the route with the generator mocked (valid, malformed JSON, invalid input, oversized body, cross-site request, each failure code).
- `npm run lint`, `npx tsc --noEmit` — passed after the switch. `npm run build` passed before the switch and was re-run afterwards (see below).
- LIVE, real Gemini call through the running app, 2026-10-10: a plain request returned HTTP 200 with 3 outfits in about 4 s; a second real request through the actual form returned 3 outfits and 9 palette swatches, with focus moved to the results heading. The output text contained no currency symbols or links.
- Prompt-injection check: notes asking for rupee prices and a shop link made the model comply, and the output validator rejected it (HTTP 502 `invalid_output`, friendly error). No price or link reached the page. The user sees a generic "try again" message in that case.
- Diagnostic that found a real bug: a request using the `responseFormat` shape shown on one Google docs page was rejected with HTTP 400; `responseMimeType` + `responseJsonSchema` was accepted. The code uses the accepted shape. The key's visible model list included the default model.
- Browser: empty submit shows the problems list and moves focus to it; the fourth style is disabled once three are chosen; the earlier no-key run showed the loading state then a friendly error; route status codes checked: 400 bad JSON and bad input, 413 oversized, 405 GET.
- No horizontal overflow at 1024, 375 and 320 px with real AI results; keyboard Tab shows a visible outline on tiles and Space selects.

NOT verified: cost per request, output quality across many inputs, behaviour on Vercel (the key and variables are only in `.env.local`), real phones, screen readers. Whether Google may use submitted text to improve its products depends on the API plan attached to the key; check that before inviting the public, because the notes field is free text.

Known limitations:
- No rate limiting. Cost control currently relies on input limits, the token cap and the quota or billing settings of the Gemini API key. A cheap per-visitor limit is needed before wide launch.
- `npm audit` reports 5 high-severity findings in the ESLint tooling chain (`eslint-config-next`, via `braces`). These are development tools, not shipped code, and were present before this work. The suggested fix is a breaking downgrade, so it was not applied.

### Homepage, second version (2026-10-10, awaiting owner review)

Rebuilt to the "Style that feels like you." brief. This replaces the first version described further down.

Sections, in order: header, hero, personal styling features (`#features`, with `#hair-studio` and `#shop-your-style` inside it), how it works (`#how-it-works`), editorial showcase, FIX My Style spotlight (`#fix-my-style`), Style Journal preview (`#style-journal`), final call to action, footer.

What changed and why:
- Photography replaces the SVG illustrations. 12 photos from Unsplash's free library are loaded through `next/image` from `images.unsplash.com` (allowed in `next.config.ts`). IDs, photo pages and photographer handles are recorded in `lib/photos.ts`. `components/editorial-art.tsx` was deleted as unused.
- The announcement strip was removed: there is nothing genuine to announce.
- Brand name, tagline and description are centralised in `lib/brand.ts` because the name is provisional.
- Navigation now has Discover Your Style, FIX My Style, Hair Studio, Style Journal, Shop Your Style and an Account entry. The full menu shows from 1024 px; below that a menu button is used.
- Seven features are presented with two image-led blocks (Colour Analysis, Hair Studio) and five text-led ones, rather than seven equal cards.

Functional versus placeholder:
- Functional: navigation, mobile menu, all section links, all buttons, image loading.
- Placeholder pages (each says the feature is not built and collects nothing): `/stylist`, `/fix-my-style`, `/account`.
- Not built, and labelled as such on the page: every styling feature, the Journal articles (shown as previews, not links), and the footer entries Saved Styles, Wishlist, About, Contact, Privacy and Terms (shown as text with a "Soon" tag, not links).

Verification on 2026-10-10 (dev server, http://localhost:3000):
- `npm run lint` — passed. `npx tsc --noEmit` — passed. `npm run build` — passed; `/`, `/_not-found`, `/account`, `/fix-my-style`, `/stylist` prerendered as static.
- All 12 photos returned HTTP 200 through the Next.js image optimiser.
- Measured at 1440, 1280, 1024, 768, 430, 375 and 320 px: no horizontal overflow, header content fits, every visible link and button is at least 44 px in both directions, hero headline is two lines.
- Mobile menu at 375 px: opens, Tab reaches the first link with a visible outline, Escape closes it and returns focus, choosing "Hair Studio" closes it and scrolls to the section below the header.
- Navigation: FIX My Style button → `/fix-my-style`; "Back to the homepage" → `/`; Account → `/account`; footer Style Journal → `/#style-journal`; hero button → `/stylist`.
- No browser console errors.
- Looked at visually (screenshots): every section at about 1024 px wide and the hero at 375 px. Other widths were checked by measurement only.

Not tested: real devices, other browsers, screen readers, a full contrast audit, Lighthouse/performance, the production build in a browser, reduced-motion behaviour, social-share previews.

Known limitations:
- Photos are hot-linked from Unsplash, so the site depends on Unsplash staying available. Unsplash's licence covers the photographs; it does not include model releases, and the hero and some other photos show people. Review before a public launch.
- No social-share image and no `metadataBase`, because the site has no public URL yet.

### Homepage, first version (built 2026-10-09, superseded)

Sections implemented, in order: announcement strip, header with navigation, hero, value proposition (`#discover`), how it works (`#how-it-works`), editorial style showcase (`#style-journal`), closing call to action, footer.

Design decisions:
- Palette from the brief, defined as tokens in `app/globals.css`. One colour was added: stone `#5F554D` for secondary text, because taupe, rose and olive do not have enough contrast for small text on ivory.
- Fonts via `next/font/google`: Cormorant Garamond (display serif) and Geist (sans, already in the template).
- Imagery is original SVG illustration (`components/editorial-art.tsx`), not photography. No remote images and no image licences are involved. The page states that the showcase is illustration and not product listings.
- "Find My Style", "Discover My Style" and "Start Discovering" all link to `/stylist`, which says the questionnaire is not built. Nav links scroll to homepage sections. There are no Privacy or Terms links because no such pages exist.
- Copy in the value and how-it-works sections is worded as what is being built, and the how-it-works section says the experience is not available yet.

Responsive behaviour:
- Below 768 px: menu button with a drop-down panel, single-column hero (text and full-width buttons first, then a landscape-cropped illustration), stacked sections.
- 640 px and up: showcase becomes three columns. 768 px and up: horizontal navigation with header button, two-column hero with a portrait illustration, three-column value section.
- 1024 px and up: how-it-works splits into heading and steps columns. 1280 px and up: hero buttons sit side by side.

Verification (all on the dev server at http://localhost:3000 unless stated):
- `npm run lint` — passed. `npx tsc --noEmit` — passed. `npm run build` — passed; `/`, `/_not-found` and `/stylist` prerendered as static.
- Measured in the browser at 1440, 1280, 1024, 768, 640, 430, 375 and 327 px: document width equals viewport width and no element extends past the viewport. 327 px was the narrowest the preview pane allowed; 320 px was NOT tested.
- Every visible link and button is at least 44 px tall at those widths.
- Mobile menu at 375 px: opens, `aria-expanded` and label update, Tab moves into the links with a visible focus outline, Escape closes it and returns focus to the button, choosing a link closes it and scrolls to the section below the sticky header.
- Navigation: "Start Discovering" reaches `/stylist`; the footer "Style Journal" link from `/stylist` returns to the homepage section.
- No browser console errors and no dev-server errors.
- Looked at visually (screenshots): all sections at 1440 px; hero, open menu and showcase at 375 px; hero at 768 px; `/stylist` at 375 px. Other widths were checked by measurement only. The preview pane's screenshots were unreliable at emulated sizes (timeouts, cropped or tiled captures), so the owner should look at the page on a real phone and in Chrome DevTools.

Not tested: real devices, browsers other than the preview pane, screen readers, a full colour-contrast audit, Lighthouse/performance, the production build in a browser, reduced-motion behaviour.

## 4. Planned Technology

Intended stack:
- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- Gemini API (replaced the originally planned OpenAI API on 2026-10-10)
- Vercel

Installation and configuration status must be checked directly in the repository.

## 5. Planned MVP

1. Premium responsive homepage.
2. Guided AI styling questionnaire.
3. Structured outfit recommendations.
4. Real product catalogue and product matching.
5. Reliable budget calculations.
6. Saved outfits and personalization when appropriate.

These are planned capabilities, not verified implementations.

## 6. Not Yet Verified

- Homepage on real devices and with real photography
- AI output quality at scale, cost, and production behaviour (the Gemini integration itself was verified live on 2026-10-10)
- Supabase database and authentication
- Product catalogue
- Product matching and price calculations
- Automated end-to-end and browser tests (unit tests exist; see Discover Your Style above)
- shadcn/ui (not installed)
- Vercel deployment

## 7. Current Blocker

None.

Next step: review, commit and open a PR for `discover-your-style`. Before deploying it, add `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) to Vercel's environment variables and confirm the key's plan and quota.

Open decisions for the owner:
- Whether to keep the default model `gemini-3.5-flash-lite` (cheapest) or set `GEMINI_MODEL` to a stronger one such as `gemini-3.8-flash`, after comparing quality and cost.
- Whether to add a per-visitor rate limit before the feature is public.
- Whether the chosen Unsplash photos are acceptable, especially those showing people, or should be swapped.
- Whether to keep hot-linking the photos or download copies into the project before launch.

## 8. Update Rules

Update this file after meaningful development work.

Only mark a feature complete when evidence supports that status.

For each completed feature, record:
- What was implemented.
- Relevant file paths.
- Tests and commands actually executed.
- Verification results.
- Remaining limitations.

Never invent completion dates, test results, or capabilities.
