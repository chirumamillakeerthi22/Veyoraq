# VEYORAQ Build Guide

The whole build, in order, from setup to launch. Each phase ends with a check you can see for yourself. Don't start the next phase until that check passes.

How we'll work together on each phase:

1. I explain what we're building and which files change.
2. I write or change the code. You review it, or I walk you through typing it yourself if you'd rather learn that way.
3. You run the check commands in PowerShell on your PC and tell me what you see.
4. We update `project_status.md` using only what was actually verified.

All commands run in **PowerShell, inside `D:\Projects\VEYORAQ`**:

```powershell
cd D:\Projects\VEYORAQ
```

---

## Phase 0: Foundation (current phase)

**Goal:** the starter app runs on your PC and is safely tracked in Git.

What I already checked on a copy of your project (Linux, Node 22, 2026-10-09):

| Check | Result |
|---|---|
| `npm ci` (install exact dependencies) | Succeeded |
| `npm run build` | Succeeded: Next.js 16.4.0, pages `/` and `/_not-found` |
| `npm run lint` | No errors |
| `npx tsc --noEmit` (type check) | No errors |
| Production server, request to `/` | HTTP 200, default starter page |

Not yet checked: your Windows PC with Node 24. That's your part.

**Your steps:**

1. Install dependencies:
   ```powershell
   npm install
   ```
   Success looks like `added N packages` with no `ERR!` lines. Warnings about `npm audit` are fine for now.
2. Start the dev server:
   ```powershell
   npm run dev
   ```
   Success looks like `Local: http://localhost:3000`. Open that in your browser. You should see the default Next.js page that says "To get started, edit the page.tsx file." Press `Ctrl+C` in the terminal to stop it.
3. Check that a `.gitignore` exists:
   ```powershell
   Get-Content .gitignore
   ```
   It must contain `node_modules`, `.next` and `.env*`. The copy I saw had no `.gitignore` (it may just not have synced), so if yours is missing too, tell me and I'll give you the exact file.
4. Set up Git and make the first commit:
   ```powershell
   git status
   ```
   If it says "not a git repository":
   ```powershell
   git init
   git add .
   git commit -m "Initial Next.js setup"
   ```
5. Optional but recommended: create a **private** GitHub repository and push to it. This gives you a backup, and later Vercel deploys from it.

**Done when:** `npm run dev` shows the default page on your PC, and `git log` shows your first commit.

---

## Phase 1: Brand foundation and layout shell

**Goal:** every page shares the VEYORAQ look, navigation and footer.

- Replace the starter page and metadata (`app/layout.tsx`: title "VEYORAQ · Style, decoded.").
- Define the design tokens in `app/globals.css`: colours, fonts, spacing. That means an editorial serif for headings, a clean sans for body text, and a restrained palette with accessible contrast.
- Build shared components in `components/`: `SiteHeader` (with a mobile menu), `SiteFooter`, `Button` and `Container`.
- Decide on shadcn/ui at this point. I'd add it only if we need things like dialogs and selects, which we will for the stylist form.

**Check:** `npm run build` and `npm run lint` pass. The header works with keyboard only (Tab, Enter, Esc closes the menu). There's no sideways scrolling at 320 px wide (Chrome DevTools, device toolbar).

---

## Phase 2: Homepage

**Goal:** a premium, responsive homepage.

Sections, in this order: hero ("Your style. Decoded." with **Find My Style** and **Build an Outfit**), what VEYORAQ does, how it works (three steps), example outfit concepts, a product discovery preview, and the footer.

- Images will be clearly labelled placeholders until you have properly licensed photos. Nothing is presented as a real product.
- Both CTA buttons link to `/stylist`, which shows a simple "coming next" page until Phase 3.

**Check:** look at it at 375, 768, 1024 and 1440 px wide, and confirm there's no clipped text and that all links work. Run `npm run build`, then commit.

---

## Phase 3: AI Stylist and Outfit Results (no products yet)

**Goal:** a user fills in a form and gets specific, validated outfit ideas.

You'll need:
- A Gemini API key from aistudio.google.com/apikey. Check the plan's usage and billing settings before sharing the app widely.
- A `.env.local` file in the project root containing `GEMINI_API_KEY=...`. **Never paste the key into chat or commit it.** A `.env.example` file with placeholder values is already in the repository.

What gets built:
- `app/stylist/page.tsx`: a form for occasion, style, budget, country and currency, colours, optional wardrobe items, and notes. It's validated in the browser *and* on the server.
- `lib/validation/`: Zod schemas for both the form input and the AI's response.
- `lib/stylist/generate.ts`: the server-only service that calls Gemini with a JSON schema, so the browser never sees the key.
- `app/api/stylist/route.ts` (or a Server Action): checks the input, calls the service, checks the response, and returns at most 3 outfits.
- The results view: outfit name, occasion, pieces, colour palette, why it works, items you already own vs. items you'd need, and a Refine button.
- Loading, error, and "AI unavailable" states, plus a basic rate limit to keep costs low.

The AI returns **categories and descriptions only**, never product names, prices or links. That rule is enforced by the schema.

**Check:** a real request returns valid outfits. Bad input shows a clear error. Removing the key shows a friendly "not configured" message instead of a crash. The page works on mobile.

---

## Phase 4: Supabase and the real product catalogue

**Goal:** a small, honest product catalogue, and outfit pieces matched to it.

You'll need: a free Supabase project. Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.

- `supabase/migrations/001_products.sql`: `products` and `product_listings` tables (name, brand, category, colour, image URL, retailer, product URL, price, currency, source, last verified), with Row Level Security set so the public can read and only admins can write.
- A starter catalogue of about 20 to 40 items that **you** collect by hand from retailers whose terms allow it, each with its source and a verification date. Retailer images are only used when that's allowed. Otherwise we show a neutral placeholder.
- `lib/catalogue/match.ts`: matches outfit pieces to products by category, colour, style and budget, and says honestly when nothing matches.
- `lib/budget.ts`: adds up actual listing prices only, flags anything missing or in a different currency, and never says "within budget" unless the numbers prove it. This gets unit tests.
- `app/discover/page.tsx`: a product grid with filters for category, price, colour and retailer.

**Check:** unit tests pass for the budget calculation. An empty catalogue shows a helpful message. Prices are shown with their currency and "last verified" date.

---

## Phase 5: Accounts, Saved Looks, Wardrobe, Profile

**Goal:** returning users can keep their stuff.

- Supabase Auth (email magic link to start).
- Tables: `profiles`, `saved_outfits`, `wardrobe_items`, and `user_preferences` if needed, each with RLS so users only ever see their own rows.
- Pages: `/saved`, `/wardrobe`, `/profile`, including a "delete my data" action.
- Wardrobe items can be pulled into stylist requests.

**Check:** I'll test with two test accounts that one user can't read the other's data. That's an actual RLS test, not an assumption.

---

## Phase 6: Testing and polish

- Automated tests: unit tests (Vitest) for validation, matching and budget, plus a few end-to-end tests (Playwright) for the main journey on mobile and desktop sizes.
- Accessibility pass: labels, focus outlines, contrast, keyboard-only use.
- Performance: optimised images and no unneeded dependencies.

---

## Phase 7: Deploy to Vercel

1. Push to GitHub, then import the repo in Vercel.
2. Add the environment variables in Vercel's project settings, never in code.
3. Set Supabase Auth redirect URLs to the Vercel domain.
4. Check the live site: the stylist works, products load, login works, and it looks right on your phone.
5. Check the Vercel logs for errors.

**Done when:** the live URL passes the same checks as local.

---

## Rules that apply throughout

- Small steps, each one built, tested and committed.
- Secrets live in `.env.local` and Vercel settings only. They never go in code, chat or Git.
- No invented products, prices, links, or test results.
- `project_status.md` is updated after each phase with evidence.
