"use client";

import { useAppData } from "@/hooks/use-app-data";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { InvoiceActions } from "@/components/orders/invoice-actions";

export function OrderDetail({ id }: { id: string }) {
  const { data, loading } = useAppData();
  const { hasPermission } = useAuth();

  if (loading) return <LoadingState />;
  const txn = data?.transactions.find((t) => t.id === id);
  if (!txn || !data) return <ErrorState message="Transaction not found" />;

  const customer = data.customers.find((c) => c.id === txn.customerId);
  const totalsMatch = Math.abs(txn.total - (txn.subtotal + txn.taxTotal)) < 0.01;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {txn.receiptNumber}
            <Badge>{txn.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            {txn.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-4 border-b pb-2">
                <div>
                  <p className="font-medium">
                    {i.productName} × {i.quantity}
                  </p>
                  {i.modifierNames.length > 0 && (
                    <p className="text-muted-foreground">{i.modifierNames.join(", ")}</p>
                  )}
                  {i.notes && (
                    <p className="text-muted-foreground italic">&ldquo;{i.notes}&rdquo;</p>
                  )}
                </div>
                <span className="shrink-0">{formatCurrency(i.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 border-t pt-2">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(txn.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(txn.taxTotal)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-2 text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(txn.total)}</span>
            </div>
            {!totalsMatch && (
              <p className="text-xs text-amber-600">
                Totals were recalculated — refresh if amounts look stale.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {txn.payments.map((p) => (
              <div key={p.id} className="flex justify-between gap-4">
                <span className="capitalize">{p.method}</span>
                <span>{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        {hasPermission("finance.view") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">FIFO COGS</CardTitle>
            </CardHeader>
            <CardContent>{formatCurrency(txn.fifoCogsTotal)}</CardContent>
          </Card>
        )}
        {customer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>{customer.name}</p>
              <p className="text-muted-foreground">{customer.phone}</p>
            </CardContent>
          </Card>
        )}
        <InvoiceActions
          transaction={txn}
          customer={customer}
          receiptSettings={data.receiptSettings}
        />
      </div>
    </div>
  );
}
