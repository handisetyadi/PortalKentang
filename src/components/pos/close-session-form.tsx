"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useAppData } from "@/hooks/use-app-data";
import { useAuth } from "@/components/providers/auth-provider";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  closingCash: z.coerce.number().min(0),
});

export function CloseSessionForm() {
  const router = useRouter();
  const { data, persist, loading } = useAppData();
  const { session } = useAuth();

  const openSession = data?.posSessions.find((s) => s.status === "open");

  const sessionTxns =
    data?.transactions.filter((t) => t.posSessionId === openSession?.id) ?? [];
  const cashSales = sessionTxns
    .flatMap((t) => t.payments)
    .filter((p) => p.method === "cash")
    .reduce((s, p) => s + p.amount, 0);
  const expectedCash = (openSession?.openingCash ?? 0) + cashSales;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { closingCash: expectedCash },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!data || !openSession || !session) return;
    const updated = data.posSessions.map((s) =>
      s.id === openSession.id
        ? {
            ...s,
            status: "closed" as const,
            closedBy: session.userId,
            closingCash: values.closingCash,
            closedAt: new Date().toISOString(),
          }
        : s
    );
    await persist({ ...data, posSessions: updated });
    router.push("/dashboard");
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (!openSession) {
    return (
      <Alert>
        <AlertDescription>No open session to close.</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-6">
      <div className="rounded-lg border p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Opening cash</span>
          <span>{formatCurrency(openSession.openingCash)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cash sales</span>
          <span>{formatCurrency(cashSales)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Expected cash</span>
          <span>{formatCurrency(expectedCash)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Transactions</span>
          <span>{sessionTxns.length}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="closingCash">Counted cash</Label>
        <Input id="closingCash" type="number" {...form.register("closingCash")} />
      </div>

      <Button variant="outline" asChild className="w-full">
        <Link href="/inventory/counts">Physical stock count</Link>
      </Button>

      <Button type="submit" className="w-full">
        Close session
      </Button>
    </form>
  );
}
