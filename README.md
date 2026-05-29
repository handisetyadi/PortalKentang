# PortalKentang

Multi-tenant offline-first POS, inventory, recipe/BOM, CRM, and commercial dashboard.

## Quick start

```bash
npm install
npm run dev
```

Login (Supabase admin): **Company** `Kentang`, **Username** `Kentang`, **Password** `Kentang`

## Stack

- Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui
- Zustand (cart/session), Dexie (offline cache), TanStack Query
- Supabase (schema + RLS migrations in `supabase/migrations/`)
- Data loaded from Supabase when signed in; Dexie used as offline cache

## Features

- POS selling with variants, modifiers, cart, payments
- Open/close POS session with cash reconciliation
- FIFO inventory, receiving, wastage, stock counts
- Recipes with ingredient lines and versioning
- CRM customers and purchase history
- Commercial dashboard with charts and recommendations
- Offline sync queue and status badge
- Receipt browser print (QZ Tray scaffold)
- Invoice email/WhatsApp API placeholders

## Supabase

```bash
supabase start
supabase db reset
```

Set `.env.local` from `.env.example`, then seed the cloud database:

```bash
npm run db:seed-admin
```

## Deploy (GitHub + Vercel)

1. Push branch to GitHub: `git push -u origin cursor/supabase-auth-pos-and-data-wire`
2. In [Vercel](https://vercel.com), import the GitHub repo and select that branch.
3. Add environment variables (required at **build** time for `NEXT_PUBLIC_*`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional for runtime admin scripts)
4. Deploy. After changing env vars, trigger a **Redeploy** so the client bundle is rebuilt.

CI runs on push via `.github/workflows/ci.yml` (build + tests).
