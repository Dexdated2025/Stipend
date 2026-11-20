# Stipend: website + demo app

The mandate layer for AI agents. This repo contains:

- **Landing page** (`/`): hero with animated payment flow, problem, product modules (Guardrails, Passport, Sweep), how it works, built-on badges, SDK preview, design partner signup form.
- **Demo dashboard** (`/app`): Overview, Agents, Agent Passport pages, Mandates editor, Payments ledger with a live payment simulator, Treasury (Sweep), Settings. All demo data is simulated in the browser and saved to localStorage. "Reset" restores it.
- **Signup backend**: design partner signups are saved to a Supabase Postgres table with insert-only security.
- **Testnet wallet** (`/app/testnet`): connect MetaMask (or any EIP-6963 wallet), auto-switch to Base Sepolia, see test ETH and test USDC balances, sign each agent's mandate with EIP-712 (verified in the browser and shown on its Passport), and settle approved simulator payments as real test-USDC transfers on Base Sepolia.

Stack: Vite, React 19, TypeScript, Tailwind CSS 3, React Router 7, Motion (motion/react), Recharts, lucide-react. No server code. It deploys as a static site anywhere.

Design principle: "Do we need words, or can a visual do the job?" The landing page carries about 130 words of copy. Everything else is shown with animation, diagrams and live mini-UIs.

---

## 1. Run it locally (optional)

Needs Node.js 20.19+ (22 recommended).

```bash
npm install
cp .env.example .env.local   # add your Supabase values (step 2), or leave blank for local testing
npm run dev                  # http://localhost:5173
```

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Type-checks and builds to `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm test` | Runs the mandate engine tests |

Without Supabase keys, local dev keeps signups in your browser's localStorage. A **production build without keys shows an error on submit** so you never lose leads silently.

## 2. Set up the signup database (Supabase, free tier is fine)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor > New query**, paste everything from `supabase/migrations/0001_design_partner_signups.sql`, click **Run**.
3. Open **Project Settings > API** (may be labelled **Data API** / **API Keys**). Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon** key or **publishable** key → `VITE_SUPABASE_ANON_KEY`
   Never use the `service_role` or secret key. It would be exposed in the browser.
4. Signups appear in **Table Editor > design_partner_signups**.

The table only allows inserts from the website. Nobody can read the list through the public API.

**Want an email for each signup?** In Supabase go to **Database > Webhooks**, add a webhook on `INSERT` into `design_partner_signups`, and point it at a Zapier/Make/n8n hook that emails or posts to Slack/Telegram.

## 3. Deploy

### Option A: GitHub + Vercel (recommended, free)

1. Create a new GitHub repo and upload this folder (everything except `node_modules` and `dist`). The GitHub web uploader works: **Add file > Upload files**, drag the contents in.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo. Vercel detects Vite automatically (`vercel.json` is included).
3. Under **Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (and optionally `VITE_CONTACT_EMAIL`).
4. Click **Deploy**. You get a live `*.vercel.app` URL in about a minute.
5. Custom domain: **Project > Settings > Domains**, add your domain, then add the DNS records Vercel shows you at your registrar.

#### usestipend.xyz (live domain)

Bought through Vercel, so Vercel runs its DNS (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) and there are no records to set by hand. `usestipend.xyz` redirects (308) to `www.usestipend.xyz`, which serves Production. HTTPS certificates are issued automatically. Renews yearly in Vercel (Account > Domains).

Every push to the main branch redeploys automatically. If you change env vars, redeploy, because Vite bakes them in at build time.

### Option B: Netlify

Connect the GitHub repo at [app.netlify.com](https://app.netlify.com). `netlify.toml` already sets the build command, output folder, Node version and SPA redirects. Add the same env vars under **Site configuration > Environment variables**, then deploy.

### Option C: Cloudflare Pages

Connect the repo, build command `npm run build`, output directory `dist`, add the env vars. `public/_redirects` handles SPA routing.

### Deploy checklist

- [ ] SQL migration run in Supabase
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set on the host
- [ ] Test the form on the live site, then check the row in Supabase
- [ ] Optional: `VITE_CONTACT_EMAIL`, custom domain, signup notification webhook
- [ ] Visit `/app/payments` directly to confirm deep links load (SPA rewrite)

## 4. Project map

```
src/
  App.tsx                     Routes. Dashboard pages are lazy-loaded.
  main.tsx                    Entry point
  styles/index.css            Tailwind layers and shared classes (.card, .field, .eyebrow)
  components/
    ui/                       Button, Badge, Modal, Toggle, Toast, Logo
    motion/                   Shared animation primitives
    visuals/                  PassportCard (3D tilt), SweepTank (liquid buffer)
    landing/                  SiteNav, Hero, HeroGate, Marquee, ProblemVisual, ProductShowcase, ScrollStory, Developers, DesignPartnerForm, SiteFooter
    app/                      AppShell (sidebar layout), Simulator, MandateFields, Shared (tables, KPI cards, feed)
  pages/
    Landing.tsx, NotFound.tsx
    app/                      Overview, Agents, AgentDetail, Mandates, Payments, Treasury, Settings
  lib/
    signups.ts                Form validation and Supabase insert
    utils.ts                  Formatting helpers
    demo/
      types.ts                Domain model (Agent, Mandate, Payment, Treasury...)
      mandate.ts              The rule engine. Every simulated payment runs through evaluatePayment()
      mandate.test.ts         Tests for the rule engine and seed data
      seed.ts                 Deterministic demo data (6 agents, ~115 payments, treasury)
      selectors.ts            KPIs, chart series, activity feed
      store.tsx               React context store, localStorage persistence, all demo actions
supabase/migrations/          SQL for the signup table
tailwind.config.js            Brand colours and fonts. Change a hex here, it updates everywhere.
```

## 5. Brand tokens: three colours, three jobs

| Role | Token | Hex | Use |
|---|---|---|---|
| Soft | `bg`, `deep`, `surface`, `raised`, `lift` | `#141518` `#111215` `#16171B` `#1C1D22` `#23242A` | Charcoal canvas, layered, with a subtle grain overlay |
| Bold | `tangerine` | `#FF8A1F` | Primary CTAs, the single key number, blocked states, active selection. About 5% of a screen at most |
| Halo | `electric` | `#2B5BFF` | Light, never paint: glows, gradient borders, focus rings, chart gradients, cursor spotlight. Never a flat button fill |

Status colours (`success`, `danger`) are desaturated so they never compete.

Motion lives in `src/components/motion/primitives.tsx` (Reveal, Stagger, CountUp, Magnetic, Tilt, SpotlightCard). Everything respects `prefers-reduced-motion` through `<MotionConfig reducedMotion="user">` in `main.tsx`.

Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (numbers, addresses, code), loaded from Google Fonts in `index.html`.

## 6. Editing with ChatGPT / Codex

- **ChatGPT Codex**: push this repo to GitHub, connect the repo in Codex, and ask for changes. `AGENTS.md` tells it the stack, structure, commands and rules.
- **ChatGPT chat**: upload the zip (or individual files) and ask for changes. Paste back the changed files.
- After any change, run `npm run build` and `npm test` before deploying.

## 7. Testnet (Base Sepolia)

1. Install MetaMask and open `/app/testnet`. Click **Connect wallet**. The app asks MetaMask to add and switch to Base Sepolia (chain 84532).
2. Get test ETH for gas from the Coinbase CDP faucet and test USDC from faucet.circle.com (pick Base Sepolia). The Testnet page links both.
3. In **Mandates**, click **Sign with wallet**. MetaMask shows the mandate as typed data (EIP-712). The signature is verified in the browser and appears on the agent's Passport. Editing the mandate marks the signature outdated.
4. In the simulator, pick the **Testnet · $1** preset and run it. When the mandate approves, MetaMask asks you to send that amount of test USDC to the vendor's demo address. The result links to BaseScan.

Vendor demo addresses are derived deterministically from the vendor id (`vendorAddress()` in `src/lib/web3/config.ts`). They belong to no one; test USDC sent there is parked. No private keys exist anywhere in this codebase.

## 8. What is real and what is simulated

Real: the website, routing, form validation, the Supabase signup pipeline, the mandate rule engine logic, wallet connection, EIP-712 mandate signatures, and test-USDC settlements on Base Sepolia.
Simulated: agent wallets, the seeded payments and balances, the treasury and yield, and API keys in `/app`. Nothing touches mainnet or moves real money. The site says so in the dashboard banner and the footer. Yield figures use an illustrative 4% APY and are labelled as not guaranteed.
