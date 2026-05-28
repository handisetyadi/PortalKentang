# Removing the demo superuser (Kentang)

When Supabase auth is connected, remove the temporary superuser:

1. Delete or disable:
   - `src/lib/auth/demo-superuser.ts`
   - Demo branches in `src/lib/auth/actions.ts` (`matchesDemoSuperuserCredentials`)
2. Set `DEMO_SUPERUSER_ENABLED=false` and `NEXT_PUBLIC_DEMO_SUPERUSER_ENABLED=false`
3. Remove `isDemoSuperuser` from sessions and `UserSession` type
4. Remove `DemoSuperuserBanner` and login form demo hint
5. Implement real Supabase `signInWithPassword` in `loginAction`
6. Clear browser cookies named `pk_session`

No database rows exist for the demo user — only an HTTP-only cookie.
