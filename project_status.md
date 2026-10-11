
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

Missing-key behaviour (added 2026-10-10): `/stylist` checks `GEMINI_API_KEY` (`lib/stylist/config.ts`) and shows the "coming soon" page instead of the form when it is absent or whitespace-only, so visitors never fill in a form that cannot work. The check runs when the page is built, so a key added in Vercel takes effect after the next deployment. Verified with two production builds: a build with the key overridden by whitespace prerendered the coming-soon page with no form, and a normal build prerendered the form. `npm test` is now 4 files, 47 tests.

Results visuals and shorter text (2026-10-11, branch `outfit-visuals`, NOT committed, not deployed):
- Owner feedback: layout fine on mobile, but too much text and no pictures of the outfits.
- Each outfit is now shown as an illustrated outfit board drawn from the recommendation itself (`lib/stylist/board.ts`, `components/stylist/outfit-board.tsx`): one generic garment shape per piece, filled with the piece's colour, plus a palette strip. It is an illustration of a concept, not a photo and not a product, and the page says so ("Illustrated concepts, not products").
- To draw it, each piece now carries a `hex` colour in the AI output schema (required, validated).
- Text was cut: shorter limits in the schema, a prompt that asks for very short phrases, no "Palette" or "Outfit n" labels, compact piece list with colour dots, and "Why it works" plus the styling tip moved into a collapsed section. Page and form hints were shortened. A typical card dropped to roughly 300 characters of visible text.
- Why illustrations and not AI-generated photos: image-generation models are not available on this free-tier key (both tried returned quota exceeded immediately), and stock photos would not match the recommendation. Generated photos could be revisited on a paid plan.
- Limits of the drawings: shapes are generic (no sleeves variety, one shoe style besides boots, accessories are a scarf or necklace shape); the AI's hex values decide colours, so a vague colour name can produce an odd shade.
- Verified: 87 tests pass (new board layout and schema tests), lint, `tsc` and production build pass. A real request through the actual form on the dev server returned 3 outfits drawn as boards (4 garments in the first), at 390 px and 1280 px, no overflow, no console errors, the collapsed section opens on click.
- Not verified: production (not deployed), real phones, screen readers, how the drawings look across many different outfits.

Free tier (found 2026-10-11): the key is on the free tier. Google's Gemini API terms for unpaid usage say submitted content and responses may be used to improve Google products, human reviewers may read them, and personal information should not be submitted. The terms also bar API clients likely to be accessed by people under 18. Consequences: a warning was added next to the notes field; free-tier quotas are low, so busy periods will show "We're busy right now" (HTTP 429 from Google is handled); there is no spend risk on the free tier. Moving to a paid plan changes the data terms (Google states it then does not use prompts or responses to improve products).

Rate limiting (added 2026-10-11, `lib/stylist/rate-limit.ts`, applied in `app/api/stylist/route.ts`):
- Per visitor (by IP address): 8 requests per 10 minutes and 40 per 24 hours. The 9th request in a window gets HTTP 429 with a `Retry-After` header and a message saying how long to wait. Only well-formed requests that would reach the AI count; invalid requests and refused requests do not use allowance or extend the wait.
- It is in memory only: no database, no tables, no new service. Memory is bounded (least recently used visitors are dropped beyond 5,000).
- It is BEST EFFORT. On Vercel, counters live in one server instance, several instances can run at once and instances restart, so a determined caller can exceed it. It is a first layer, not a guarantee.
- The visitor's IP comes from `x-vercel-forwarded-for`, then `x-forwarded-for`, then `x-real-ip`. Vercel's documentation says the platform sets and overwrites these, so clients cannot spoof them there. Locally and on any other host they can be spoofed.
- Verified: 66 unit tests pass (limiter, IP extraction, route behaviour). A real production build (`next start` on port 3100, key blanked so no AI call could be made) returned 8 responses then HTTP 429 with `Retry-After: 600`, a second visitor was unaffected, and an invalid request from a refused visitor returned 400.

Shared protection that must still be configured by the owner in dashboards (NOT done, because it cannot be done from code):
1. Vercel Firewall rate-limit rule. Vercel's documentation says WAF rate limiting is available on all plans, with one rule on Hobby, a fixed window of 10 s to 10 min, and counting by IP. Counters are per region. Suggested rule: path equals `/api/stylist`, method POST, limit 10 requests per 60 seconds per IP, action default (429). Dashboard: project > Firewall > Configure > New Rule > Then: Rate Limit, then Publish.
2. A quota or spending cap on the Gemini API key, so the worst case is bounded whatever the traffic.

Known limitations:
- Rate limiting is best effort and per instance (see above). Until the two dashboard settings exist, cost protection is the in-app limiter, input limits, and the token cap.
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

Next step: review and merge branch `outfit-visuals` (illustrated outfit boards and shorter text). Set up the Vercel Firewall rule described above. Decide about the notes field and the plan (see "Free tier" below). After that, connect Supabase on a new branch (client files and a connectivity check only; no tables).

State of production (verified 2026-10-11): PR #2 is merged and deployed; `GEMINI_API_KEY` is set for the Production environment; `/stylist` shows the form and a real request returned three outfits.

Open decisions for the owner:
- Whether to keep the default model `gemini-3.5-flash-lite` (cheapest) or set `GEMINI_MODEL` to a stronger one such as `gemini-3.8-flash`, after comparing quality and cost.
- Free tier (see below): keep the free-text notes field with its warning, remove it, or move the key to a paid plan.
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
