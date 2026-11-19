# AGENTS.md

Instructions for AI coding agents (ChatGPT Codex, Claude Code, Cursor and similar) working on this repo.

## Project

Stipend marketing site plus a simulated product demo. Static single-page app, no backend except a Supabase table for signups.

- Stack: Vite 8, React 19, TypeScript 5.9 (strict), Tailwind CSS 3.4, React Router 7, Motion (motion/react), Recharts 3, lucide-react.
- Design principle: for every piece of text ask "Do we need words, or can a visual do the job?" Keep landing body copy under 220 words. No explanatory paragraphs in the dashboard.
- Routes: `/` landing, `/app/*` demo dashboard (lazy-loaded), `*` 404.
- Demo state lives in `src/lib/demo/store.tsx` (React context + localStorage key `stipend-demo-v1`).
- The payment rule engine is `src/lib/demo/mandate.ts`. Keep it pure and covered by `mandate.test.ts`.

## Commands

```bash
npm install
npm run dev        # local dev server on :5173
npm run build      # tsc --noEmit && vite build. Must pass before you finish.
npm test           # vitest. Must pass before you finish.
```

## Rules

1. **Copy style:** short, plain English. **Never use em dashes** in any user-facing text. Use commas, full stops or colons.
2. **Colours:** three colours, three jobs. Charcoal (`bg`, `deep`, `surface`, `raised`, `lift`) is the soft canvas. Tangerine is the bold accent, used sparingly (CTAs, the key number, blocked states). Electric blue is the halo: glows, gradients, focus rings, chart fills, never a flat fill. Use tokens only; Recharts and SVG props are the one exception and use the same hexes.
3. **Buttons:** use `Button` / `LinkButton` / `buttonClass` from `src/components/ui/Button.tsx`. Variants: `primary` (tangerine), `halo` (blue light border), `ghost`, `danger`.
3b. **Motion:** build animations from `src/components/motion/primitives.tsx`. Animate transform and opacity only. Springs for feedback, 400 to 700ms for reveals. Respect reduced motion.
4. **Imports:** use the `@/` alias for anything under `src/`. Files inside `src/lib/demo/` import each other relatively.
5. **Demo data:** if you change the shape of `DemoState`, bump `DEMO_VERSION` in `src/lib/demo/seed.ts` so stored browser state resets.
6. **New mandate rules:** add the rule id to `RuleId` in `types.ts`, add the check in `evaluatePayment()` in the right order, and add a test.
7. **Honesty labels:** keep the "Demo mode. Simulated data" banner in `/app`, the footer disclaimer, and the "Illustrative only. Rates vary and are not guaranteed." note on any yield figure.
8. **Secrets:** only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public anon/publishable key) and `VITE_CONTACT_EMAIL` go in env. Never add a service-role key to the frontend.
9. **Accessibility:** keep labels on inputs, `aria-label` on icon-only buttons, and visible focus rings.
10. Keep pages responsive down to 360px wide.

## Where things are

| Change | File |
|---|---|
| Landing copy and sections | `src/components/landing/*` |
| Hero animation | `src/components/landing/HeroFlow.tsx` |
| Signup fields / validation / Supabase call | `src/lib/signups.ts`, `src/components/landing/DesignPartnerForm.tsx`, `supabase/migrations/*` |
| Sidebar, banner, layout | `src/components/app/AppShell.tsx` |
| Payment simulator | `src/components/app/Simulator.tsx` |
| Seed agents, vendors, payments | `src/lib/demo/seed.ts` |
| KPIs and chart data | `src/lib/demo/selectors.ts` |
| SEO / meta / fonts | `index.html` |
