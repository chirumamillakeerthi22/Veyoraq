
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
- @supabase/supabase-js 2.117.3 and @supabase/ssr 0.12.7 (added 2026-10-11 with the owner's approval)

### Project structure (VERIFIED 2026-10-09; Discover Your Style files added 2026-10-10)

Application code:
- `app/layout.tsx` — root layout: fonts, metadata (including social-sharing tags), skip link, shared header and footer.
- `app/page.tsx` — VEYORAQ homepage.
- `app/stylist/page.tsx` — Discover Your Style page (questionnaire and results).
- `app/api/stylist/route.ts` — POST endpoint: same-origin check, size limit, input validation, then the generator.
- `app/fix-my-style/page.tsx`, `app/account/page.tsx` — "coming soon" placeholders. None of these features exists.
- `lib/stylist/` — `options.ts` (choices shared by form, schema and prompt), `schema.ts` (zod input and output contracts), `prompt.ts`, `generate.ts` (server-side Gemini `generateContent` call and validation), `fixtures.ts` and `*.test.ts` (tests).
- `components/stylist/` — `stylist-flow.tsx` (client component: form, loading, error, results), `choice.tsx`, `outfit-results.tsx`, `outfit-board.tsx`.
- `lib/supabase/` — `config.ts` (reads and checks the two public settings, refuses secret keys), `client.ts` (browser client; unused so far), `server.ts` (per-request server client; used by the health check), `health.ts` (interprets the connectivity probe) and tests.
- `app/api/health/supabase/route.ts` — GET connectivity check. Returns only booleans and fixed messages, never the URL or key; rate limited to 20 per 10 minutes per visitor.
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

Present but not committed: `.env.local` (git-ignored; holds the Gemini key and the Supabase URL and publishable key). Not present: authentication, any database table, product catalogue.

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

### Fix round: login error, Saved Styles sync, Wishlist, Account menu, Settings, centred login (2026-10-12, UNCOMMITTED on `login-and-saved-styles`)

Root causes found by reproducing each problem with a real throwaway account:
1. "An error occurred" after login. Next.js 16 with Cache Components raised "`Date.now()` while prerendering" for `/account`. The Supabase session code reads the clock when a session cookie exists, and Next.js only allows that at request time. Reproduced on a plain reload while signed in (error count 1 to 2). Fix: `await connection()` before reading the session on `/account`, `/saved` (since removed) , `/account/settings` and `/account/reset-password`. After the fix no new error appeared across reload, sign-out and sign-in, and `/account` returned 200 with the signed-in view for `?`, `?x=1`, `?error=...`, `?code=...`. (Older `isSixDigitCode` errors in the console were from a half-applied edit of mine, not this bug.)
2. Saved state out of sync. The "Saved" status lived in each button's own memory, never read from the database, and Next.js keeps the Discover page mounted in the background, so the stale state came back. Looks also had no identity, so duplicates could not be detected. Fix: one shared store (`lib/saved/store.ts`) that always re-reads the database, a content-based key for each look (`lib/saved/outfit-key.ts`), one save/remove mechanism, one-at-a-time operations, and a "database confirmed it" rule before showing success.
3. The shared sign-in state is now `lib/auth/auth-store.ts`; the Account menu, the popup and the saved/wishlist stores all read it (no competing state).

Added: Account menu (real email, Saved Styles, Wishlist, Settings, Sign out; Sign in and Sign up when signed out), top-navigation links for Saved Styles and Wishlist, `/account/settings` (email, sign-in method, change password for password users, sign out; nothing else exists yet), `/wishlist` (separate from Saved Styles), `?mode=signup`, a centred and compacted sign-in card, popup timer now counts only while signed out and resets on sign-in.

DATABASE: nothing was changed or applied in this round. Two proposals await the owner's approval:
- `supabase/migrations/20261012000000_wishlist_items.sql`: NEW table `wishlist_items` with Row Level Security. No wishlist table or product catalogue existed, so there was nothing to reuse.
- `supabase/migrations/20261012000100_saved_outfits_no_duplicates.sql`: a unique index so the same look cannot be saved twice even from two tabs or devices. It changes an existing table and includes an optional, commented-out de-duplication step that deletes data; review step 1 first.

Verified in the real browser against the real project (test account, since deleted from the browser; the account itself remains in Supabase Auth for the owner to delete): saved a look, saw it in Saved Styles, removed it there, and Discover then offered "Save this look" again; saved again with a double press and got one record; hard refresh kept the state; sign-out reset both pages; Saved Styles showed a sign-in prompt signed out; sign-in restored the look; Account menu in both states; Settings; Wishlist unavailable message; centred login at 1440, 1280, 1024 (all within 1 px), phone and 320 px with no sideways overflow; popup at 2 minutes, dismissal, no popup after sign-in. 338 unit tests, lint, `tsc` and production build pass.

NOT verified: adding to, listing and removing from the Wishlist (no table); isolation between two real accounts in the app (verified at database level by the owner's 10 of 10 security test, not re-run with a second account); real Google sign-in; real password-reset email.

### Email and password, rate-limit fix and sign-in popup (2026-10-11, branch `login-and-saved-styles`, UNCOMMITTED on top of PR #5)

Why the "too many requests" message appeared (investigated, not assumed):
- Supabase's documented limits: the built-in email sender allows 2 emails per hour for the WHOLE project (all visitors share it) and cannot be raised; each address has a 60-second cooldown for sign-in codes, sign-up confirmations and password resets; sign-ups and sign-ins are 30 per 5 minutes per IP; password sign-ins (`/token`) are 150 per 5 minutes per IP. Custom SMTP makes the email limit configurable.
- Our own form made it worse. Measured in the browser: a fast double-click sent 2 requests, and after the error the button was immediately usable again, so 5 presses sent 5 requests. Fixed (see below).

What changed:
- The email-code flow was replaced by email and password, handled entirely by Supabase Auth. Passwords are never stored in our tables and `saved_outfits` is untouched: password users get the same `authenticated` role and `auth.uid()`, so the existing Row Level Security applies unchanged.
- `/account` and the popup: Continue with Google, plus Sign in / Create account tabs, show/hide password, password rules (8 to 72 bytes, a letter and a number, not the email), "Forgot your password?".
- Password reset: `/account/reset-password` (signed-out visitors see "link expired"; the page is not indexed). `/auth/confirm` now also accepts `recovery` links; reset also works through `/auth/callback` in the same browser.
- Rate-limit handling, without retrying or bypassing anything: one press is one request (in-flight guard); after a limit the buttons lock with a live countdown that is remembered across reloads; email-sending actions (sign-up, reset) are capped at 3 per 10 minutes per browser; the remaining wait comes from Supabase's own message when it gives one, otherwise 60 s (or 5 min for the email limit).
- Sign-in popup: after 2 minutes of visible time (hidden tabs don't count), once per session, centred, closable (X, "Not now", the dimmed area, Escape). Closing keeps it away for 7 days. Never shown to signed-in visitors, on `/account/*` or `/auth/*`, or while the visitor is typing. It reads Supabase's public settings so Google shows "being set up" instead of failing.

Email confirmation DECISION (owner, 2026-10-11): OFF for the early testing phase, to be turned back ON once real email sending exists. VERIFIED the same day through Supabase's public settings: `mailer_autoconfirm` is now true. New accounts are signed in immediately; the "Create account" path sends no email. Password reset still depends on email delivery and will only reach team members until custom SMTP exists. Earlier state, for reference: "Confirm email" was ON (`mailer_autoconfirm` false). The code works in both modes: with it ON, Create account sends a confirmation email (which the built-in sender can only deliver to team members, at 2 per hour); with it OFF, the visitor is signed in at once. Turning it OFF is a dashboard decision for the owner (Authentication > Providers > Email > Confirm email). Trade-offs are in the assistant's report: unverified addresses (anyone can register someone else's address, typos create unusable accounts), spam sign-ups (limited to 30 per 5 minutes per IP by Supabase), and password reset only works once real email sending exists.

Verification (2026-10-11): 286 unit tests, lint, `tsc` and production build pass. In the real browser at 390 px: a wrong password against the real project returns "That email and password don't match"; a double-click makes 1 request (was 2); a rate-limited press locks the button with a countdown and 5 further presses make 0 requests; the cooldown survives a reload; weak passwords and bad emails are caught with no request; reset sends 1 request and does not reveal whether the account exists; the 4th reset in 10 minutes is refused locally; the popup does not show at 100 s, shows at 120 s centred (352 px on a 390 px screen) with both options, records its dismissal on every close path and stays away, and never shows on `/account`; both landing routes fail safely for bogus tokens.

NOT tested end to end (they create real accounts or send real email, or need Google set up): a real sign-up, a real sign-in with a real password, logout, session persistence across reloads, a real reset email, a real Google sign-in. A checklist for the owner is in the assistant's report.

### Save this look and Saved Styles (2026-10-11, branch `login-and-saved-styles`, PR #5)

The owner approved the `saved_outfits` table as proposed and ran the SQL in the Supabase SQL Editor (the assistant has only the public key and no database administrator access).

DATABASE, VERIFIED 2026-10-11:
- The owner ran `supabase/tests/saved_outfits_security_test.sql` after the migration. Supabase returned: "ALL SECURITY TESTS PASSED (10 of 10). Nothing was saved: this script always rolls back." (The red "error" is the deliberate rollback.) The 10 checks: own save works; own read works; saving as another user is refused; editing is refused; an outfit over 8 KB is refused; the 100-outfit limit applies; another user sees none of the rows; another user cannot delete them; a signed-out visitor cannot read; the owner's 100 rows were intact.
- Independent check with the public key only: before the migration `saved_outfits` returned PGRST205 (table not found); after, the same request returns 42501 (permission denied). Signed-out read, insert and delete are all refused with HTTP 401.
- Still not exercised from the app: saving, listing and deleting with a real signed-in user.

Built and unit tested:
- "Save this look" on each result card. A signed-out visitor is told to sign in (the link opens in a new tab so the results stay on the page); no Supabase request is made for them. A signed-in visitor's save inserts one row (name, validated outfit, and the five questionnaire choices; the free-text notes are never stored). The user id is filled in by the database, never sent by the browser.
- `/saved` (listed in the footer and on `/account`) shows the signed-in visitor's looks, newest first, with a confirm-then-remove button. Rows are re-validated when read; invalid rows are skipped.
- Friendly messages: table missing ("Saving isn't available yet"), not signed in, the 100-outfit limit, and a generic fallback. Raw database text is never shown.
- Shared `OutfitCard` component used by results and saved pages.

Verification: 216 unit tests, lint, `tsc` and production build pass (`/saved` is partially prerendered). Real browser at 390 px with only the AI call stubbed: results show Save buttons and a signed-out press shows the sign-in note with a new-tab link and makes no Supabase request.

NOT verified: saving, listing and deleting from the app with a real signed-in user, and the signed-in `/saved` page. These need a real sign-in (an email code or Google), which only the owner can complete. The database rules themselves are verified above.

### Sign in with Email and Continue with Google (2026-10-11, PR #5)

Both methods are implemented in code and unit tested. They are NOT yet usable end to end, because the dashboard setup below has not been done. Nothing is stored in the database by this work: sign-in only creates a Supabase Auth user.

What exists:
- `/account` shows both options side by side. Signed in, it shows the email, how they signed in, and a sign-out button.
- Email: SUPERSEDED on 2026-10-11 by email and password (see "Email and password, rate-limit fix and sign-in popup" below). The first version used a 6-digit emailed code; it was removed because it depended on the project's 2-emails-per-hour built-in sender.
- Google: `signInWithOAuth`, returning to `/auth/callback`, which exchanges the code for a session.
- `proxy.ts` refreshes sessions, limited to `/account`, `/saved/*` and `/auth/*`, so the homepage and stylist are untouched.
- `/account` reads Supabase's public settings endpoint and shows "being set up" for a method that is switched off, instead of sending a visitor to a raw error page.
- Safety: the "next" page is restricted to paths on this site (no open redirect); only the link types `email`, `magiclink` and `signup` are accepted; raw error text from Supabase is never shown; failures redirect to `/account?error=...` with a friendly notice.

Verification (2026-10-11): 194 unit tests, lint, `tsc` and production build pass. In the real browser at 390 px: both options render, Google shows the "being set up" note, invalid email and short code are caught without any request, a sent code moves to the code step with a 60 s resend timer, an expired code shows a friendly message, and "use a different email" returns to the email step. The send and verify network calls were stubbed in that test, so no real email was sent and no user was created. The two landing routes were probed with bogus values against the real project and all failed safely, including a hostile "next" value.

NOT verified end to end: a real Google sign-in, a real email code arriving, and a real session being created. These need the owner's dashboard setup and a human to sign in.

State of the project's Supabase Auth settings when checked (public settings endpoint): `email` provider enabled, `google` NOT enabled, sign-ups allowed, email confirmation required (`mailer_autoconfirm` false).

Owner setup still required:
1. Email delivery. Supabase's built-in sender delivers only to team members, at 2 emails per hour, and is not for production. Real visitors need a custom SMTP provider (Authentication > Emails/SMTP). Until then, email sign-in works only for addresses that are members of the Supabase project team. The owner has no domain-based email address yet. Stopgap without a domain: a dedicated Gmail account with 2-Step Verification and an App Password used as the SMTP login (smtp.gmail.com, port 465 or 587). Google documents a limit of 500 emails per day for the account and says app passwords are not recommended in most cases; they are not available for work/school or Advanced Protection accounts. Replace with a domain-based SMTP provider when a domain exists.
2. Email templates (only needed once email sending works). For password reset, the "Reset Password" template should link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/reset-password` so it works in any browser; the default link also works in the same browser. If "Confirm email" stays on, the "Confirm sign up" template can use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/account`.
3. Google. Create an OAuth client in Google Cloud, enter its client ID and secret under Authentication > Providers > Google, and add the Supabase callback URL to Google's authorised redirect URIs.
4. URLs. In Supabase Authentication > URL Configuration set the Site URL to https://veyoraq.vercel.app and add http://localhost:3000/** and https://veyoraq.vercel.app/** to the redirect allow-list.
5. A Privacy page before public sign-in (the footer link is still "Soon").

### Login and Saved Styles: DESIGN ONLY (2026-10-11, branch `saved-styles-design`) — PROPOSED, NOT APPLIED

Nothing described here exists in the database. The two SQL files are proposals saved in the repository for review; saving them changes nothing in Supabase.

- `supabase/migrations/20261011120000_saved_outfits.sql` — proposed migration (one table).
- `supabase/tests/saved_outfits_security_test.sql` — proposed security test; it always rolls back. UNVERIFIED: it has not been run, because the table does not exist and the assistant has no database administrator access.

Findings that shaped the design (from Supabase's documentation, 2026-10-11):
- Supabase's built-in email sender delivers only to the project's team members, at 2 emails per hour, and is described as not for production. Email or magic-link login would need a custom email provider and a sending domain, which the project does not have.
- Sign in with Google needs no email sending. Its setup needs an OAuth client in Google Cloud, the client ID and secret entered in Supabase, and redirect URLs configured. Whether Google sign-in has any Supabase plan limit was not stated in the documentation read and must be checked on Supabase's pricing page.

Proposed table `public.saved_outfits`: `id`, `user_id` (defaults to the signed-in user, deleted with the account), `name` (1 to 50 characters), `outfit` (validated outfit JSON, at most 8 KB), `answers` (structured questionnaire choices only, at most 1 KB; the free-text notes are never stored), `created_at`. Index on (`user_id`, `created_at` descending). Limit of 100 saved outfits per user, enforced by a trigger with a clear error.

Proposed security: Row Level Security enabled; `anon` has no access; `authenticated` may select, insert and delete only rows where `user_id` equals their own id; there is no update permission, so saved outfits are immutable. Each policy names its role and uses the `(select auth.uid())` form recommended by Supabase.

Deliberately not included: a `profiles` table, a `wishlist`, a `style_profiles` table, and storage of any user photo. They have no feature that needs them yet.

Application work after approval: `proxy.ts` to refresh sessions, `/auth/callback`, a Google sign-in button and sign-out on `/account`, a "Save this look" button on results, and a `/saved` page that redraws saved boards and allows deleting. Cache Components means pages that read cookies must sit inside Suspense boundaries.

Owner tasks that cannot be done from code: create the Google OAuth client, enable the Google provider in Supabase, set the Site URL and redirect allow-list in Supabase, and run the approved SQL in the SQL Editor. A Privacy page should exist before public sign-in, and Google may require a privacy policy link to publish the consent screen (not yet verified).

### Supabase connection (2026-10-11, branch `supabase-connection`)

What exists: the connection foundation only. No tables, no migrations, no login, no data stored. The owner reported the new Supabase project has no tables and that the project ID matches; this was not independently verified, but the live check below confirms the settings reach a working project.

- `lib/supabase/config.ts` reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, requires https (or localhost), and refuses a secret key placed in a public variable (`sb_secret_...` or a JWT whose role is `service_role`).
- `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (per request, cookie aware) follow Supabase's current Next.js guidance. The browser client is not used yet.
- `/api/health/supabase` probes by reading a table that does not exist. "Table not found" proves the project answered and accepted the key; a 401/403 means the key was rejected; no answer means wrong URL or a paused project.
- Not built on purpose: `proxy.ts` (Next.js 16's replacement for middleware, which Supabase says refreshes login sessions). It is needed only once login exists.

Verification (2026-10-11):
- 120 unit tests pass, lint and `tsc` pass.
- LIVE, local dev server against the owner's real project: `/api/health/supabase` returned HTTP 200 with configured=true, keyKind=publishable, reachable=true, keyAccepted=true.
- LIVE, production, 2026-10-11 (after PR #4 merged as `36fe516` and Vercel deployed it): `/api/health/supabase` returned HTTP 200 with configured=true, keyKind=publishable, reachable=true, keyAccepted=true, with no URL or key in the response. A real stylist request on the same deployment returned 3 outfits.
- The two `NEXT_PUBLIC_SUPABASE_` variables are therefore set in Vercel (Production). The project ID match and "no tables yet" remain as reported by the owner.

Free-tier note: Supabase's free plan can pause inactive projects. A paused project makes the health check report "no answer"; unpausing it in the dashboard fixes that.

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

Next step: the owner signs in once with the email address of the Supabase account (the built-in sender can deliver to project team members, so this works without SMTP), then saves a look and opens `/saved` locally to confirm the full flow. The owner sets up custom SMTP (see the sign-in section) so other visitors can receive codes. Then PR #5 is merged.

State of production (verified 2026-10-11): PR #2 is merged and deployed; `GEMINI_API_KEY` is set for the Production environment; `/stylist` shows the form and a real request returned three outfits.

Open decisions for the owner:
- Whether to keep the default model `gemini-3.5-flash-lite` (cheapest) or set `GEMINI_MODEL` to a stronger one such as `gemini-3.8-flash`, after comparing quality and cost.
- Free tier (see below): keep the free-text notes field with its warning, remove it, or move the key to a paid plan.
- Whether the chosen Unsplash photos are acceptable, especially those showing people, or should be swapped.
- Whether to keep hot-linking the photos or download copies into the project before launch.

### Top navigation, Explore, Shop and homepage sections (branch `login-and-saved-styles`, uncommitted)

The briefly built desktop sidebar was replaced by the requested top navigation. The phone drawer was kept and reused.

- Top bar (md and up): VEYORAQ logo (links to `/`, no separate Home), Explore, Shop, Saved (full name "Saved Styles" for screen readers), Wishlist, and an Account icon. Below md: logo plus a menu button opening a drawer with the same destinations and the account section.
- Account menu: signed out shows Sign in, Sign up, Settings; signed in shows the email, My account, Settings, Sign out. Settings itself already shows a sign-in prompt to signed-out visitors.
- New `/explore`: directory of services. Only services with a real page link out (Discover Your Style `/stylist`, FIX My Style `/fix-my-style`, Style Journal `/#style-journal`); Hair Studio, Colour Analysis and Fit guidance are shown as "Coming soon" with no link.
- New `/shop`: honest placeholder. There is NO product catalogue, no products and no cart or checkout; it explains how Shop will work and links to Discover My Style and the Wishlist.
- Homepage: hero unchanged. The all-seven-services list became "Featured services" (Discover Your Style, Hair Studio, and a link to Explore). "The edit" became "Shop the Look" (editorial photos, labelled as not products, with a Go to Shop button). How it works, FIX My Style and Style Journal sections kept.
- Footer "Explore" links updated to the new destinations. No Supabase, environment, authentication or API changes. Removed my own unused `components/sidebar/site-sidebar.tsx`; `components/sidebar/sidebar-content.tsx` is now the phone drawer's content.

Verified (2026-10-11): `tsc --noEmit`, `eslint`, `vitest` (24 files, 344 tests) and `next build` pass. In a browser against the production build: header links and hrefs at 1280px; active item correct on /explore, /stylist (Explore), /shop, /saved, /wishlist; signed-out account menu stays inside the viewport and lists Sign in, Sign up, Settings; no horizontal scroll at 1280, 768 and 375px; drawer opens with focus on Close menu and lists Explore, Shop, Saved Styles, Wishlist and the account row.

Not verified: the signed-in account menu (no test account was signed in); keyboard Tab order and screen reader by hand; the drawer link navigation in this round (it reuses the code verified last round).

### Mobile-first refinement (branch `mobile-first-ux`, uncommitted)

Done on a new branch from `master`, because `login-and-saved-styles` was already merged.

- Phones (below md): compact header (wordmark, Shop icon, Account icon) and a fixed bottom bar with Home, Explore, Saved and Wishlist; the active one is highlighted. Safe-area insets are respected (`viewport-fit=cover`, bar and header padding) and the page keeps room above the bar.
- md and up: unchanged horizontal header (logo, Explore, Shop, Saved, Wishlist, Account icon). No sidebar.
- Homepage on phones: image first, headline, one sentence and one full-width CTA on the first screen (the CTA is above the bottom bar from 320x640 up); service cards are compact rows; the Journal preview shows three entries (all on md and up).
- Currency select raised to 16px so iOS does not zoom on focus.
- Removed the phone drawer and sidebar code, which the bottom bar replaced.
- Not changed: Supabase, RLS, authentication configuration, Gemini, environment variables. No new dependencies.

Verified (2026-10-11), production build, in a browser: widths 320, 360, 390, 430, 768, 1024 and 1440 on the homepage (no horizontal overflow, bottom bar shown below md only, header links at 768). At 320 also: /explore, /shop, /stylist, /saved, /wishlist, /fix-my-style, /account (no overflow, no touch targets under 43px in the checked controls, footer clear of the bottom bar, account menu inside the viewport, email input type/inputmode correct).

Not verified / not applicable: there is no photo upload or camera capture anywhere in the app (FIX My Style is a "coming soon" page), so nothing was built or tested there. Not tested on a real phone: safe-area insets on a notched device, on-screen keyboard behaviour in the sign-in dialog, iOS zoom behaviour. Keyboard Tab order and screen readers were not tested by hand. Signed-in states of the account menu, Saved Styles and Wishlist with real items were not exercised.

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
