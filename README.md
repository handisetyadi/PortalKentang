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
