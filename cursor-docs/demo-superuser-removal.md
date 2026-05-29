# Demo superuser removed

The temporary cookie-based superuser (`demo-superuser.ts`) has been removed.

## Production login

Use Supabase Auth with the seeded admin account:

| Field | Value |
|-------|--------|
| Company | `Kentang` |
| Username | `Kentang` |
| Password | `Kentang` |

Email in Auth: `kentang@demo.portalkentang.local`

## Seed admin + tenant data

```bash
npm run db:seed-admin
```

This creates the Kentang company catalog in Postgres and the admin user with all roles.

## Migrations

Schema migrations live in `supabase/migrations/`. Apply to cloud via Supabase MCP, CLI (`supabase db push`), or Dashboard SQL.
