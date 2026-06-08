"use client";

import Link from "next/link";
import { useAppData } from "@/hooks/use-app-data";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export function CustomerDetail({ id }: { id: string }) {
  const { data, loading } = useAppData();
  if (loading) return <LoadingState />;
  const customer = data?.customers.find((c) => c.id === id);
  if (!customer || !data) return <ErrorState message="Customer not found" />;

  const history = data.transactions.filter((t) => t.customerId === id);
  const ledger = data.loyaltyPointLedger.filter((e) => e.customerId === id).slice(0, 20);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{customer.phone}</p>
          <p>{customer.email}</p>
          <div className="flex gap-1">
            {customer.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
          <p>Member points: <span className="font-medium">{customer.memberPointsBalance}</span></p>
          <p>Total spend: {formatCurrency(customer.totalSpend)}</p>
          {customer.lastTransactionAt && (
            <p className="text-muted-foreground">
              Last transaction: {new Date(customer.lastTransactionAt).toLocaleString("id-ID")}
            </p>
          )}
          <p className="text-muted-foreground">
            WhatsApp opt-in: {customer.whatsappOptIn ? "Yes" : "No"} · Email:{" "}
            {customer.emailOptIn ? "Yes" : "No"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchase history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {history.length === 0 ? (
            <p className="text-muted-foreground">No purchases yet.</p>
          ) : (
            history.map((t) => (
              <Link
                key={t.id}
                href={`/orders/${t.id}`}
                className="flex justify-between border-b py-2 hover:underline"
              >
                <span>
                  {t.receiptNumber}
                  {(t.pointsEarned > 0 || t.pointsRedeemed > 0) && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t.pointsRedeemed > 0 && `-${t.pointsRedeemed}pt`}
                      {t.pointsEarned > 0 && ` +${t.pointsEarned}pt`}
                    </span>
                  )}
                </span>
                <span>{formatCurrency(t.total)}</span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Point ledger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {ledger.length === 0 ? (
            <p className="text-muted-foreground">No point activity yet.</p>
          ) : (
            ledger.map((e) => (
              <div key={e.id} className="flex justify-between border-b py-2">
                <span>
                  <Badge variant={e.type === "earn" ? "default" : "secondary"} className="mr-2">
                    {e.type}
                  </Badge>
                  {new Date(e.createdAt).toLocaleString("id-ID")}
                </span>
                <span className={e.pointsDelta >= 0 ? "text-emerald-700" : "text-destructive"}>
                  {e.pointsDelta >= 0 ? "+" : ""}
                  {e.pointsDelta} pts (bal. {e.balanceAfter})
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
