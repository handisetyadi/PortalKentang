"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "portalkentang-demo-banner-dismissed";

export function DemoSuperuserBanner() {
  const { isDemoSuperuser } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (!isDemoSuperuser || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="relative border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
      <Badge variant="warning" className="mr-2">
        Demo superuser
      </Badge>
      Signed in as <strong>Kentang</strong> with full access. This account is temporary — remove{" "}
      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">demo-superuser.ts</code> when
      Supabase auth is connected.
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2"
        aria-label="Dismiss demo banner"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
