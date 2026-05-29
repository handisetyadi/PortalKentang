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

Production should track **`main`** on GitHub. Vercel only deploys commits that exist on the remote.

1. Push your branch: `git push -u origin cursor/supabase-auth-pos-and-data-wire`
2. Open a PR into `main`, merge it (or fast-forward `main` locally and `git push origin main`).
3. In [Vercel](https://vercel.com), set **Production Branch** to `main` (Project → Settings → Git).
4. Add environment variables (required at **build** time for `NEXT_PUBLIC_*`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional for runtime admin scripts)
5. After merge or env changes, trigger **Redeploy** (Deployments → … → Redeploy) so the client bundle is rebuilt.

**Verify the live build** — compare your local HEAD with production:

```bash
git rev-parse HEAD
curl -s https://YOUR_VERCEL_URL/api/health | jq '.build'
```

`build.commit` should match the first 7+ characters of `git rev-parse HEAD` after deploy.

CI runs on push via `.github/workflows/ci.yml` (build + tests).

## Thermal printer (Android Bluetooth ESC/POS)

Direct thermal print for **Woya, Epson, generic ESC/POS** — no browser print dialog.

1. **Settings → Printer** — enable thermal, select **Android Bluetooth (SPP)**, pair MAC.
2. **Android app** — use WebView + native bridge in [`android/`](android/README.md) (`window.PortalKentangPrinter`).
3. POS / invoice **Print** sends raw ESC/POS bytes after PDF opens.

See [`cursor-docs/thermal-printer-android.md`](cursor-docs/thermal-printer-android.md) for architecture, limits, and testing.
