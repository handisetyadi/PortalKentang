"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("reason") === "db-session";

  return (
    <>
      <form action={formAction} className="space-y-4">
        {sessionExpired && !state.error && (
          <Alert>
            <AlertDescription>
              Your database session expired. Please sign in again to save sales to Supabase.
            </AlertDescription>
          </Alert>
        )}
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            name="company"
            placeholder="Kentang"
            autoComplete="organization"
            defaultValue="Kentang"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            placeholder="Kentang"
            autoComplete="username"
            defaultValue="Kentang"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </p>
    </>
  );
}
