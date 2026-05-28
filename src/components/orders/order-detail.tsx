"use client";

import { useState } from "react";
import { useAppData } from "@/hooks/use-app-data";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { PermissionGate } from "@/components/gates/PermissionGate";
import { toast } from "@/hooks/use-toast";

export function OrderDetail({ id }: { id: string }) {
  const { data, loading } = useAppData();
  const { hasPermission } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (loading) return <LoadingState />;
  const txn = data?.transactions.find((t) => t.id === id);
  if (!txn) return <ErrorState message="Transaction not found" />;

  const customer = data?.customers.find((c) => c.id === txn.customerId);
  const totalsMatch = Math.abs(txn.total - (txn.subtotal + txn.taxTotal)) < 0.01;

  const handlePrint = () => {
    toast({
      title: "Print receipt",
      description: "Browser print dialog — connect QZ Tray in production.",
    });
    window.print();
  };

  const handleEmail = async () => {
    setActionLoading("email");
    try {
      const res = await fetch("/api/invoices/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: txn.id,
          receiptNumber: txn.receiptNumber,
          customerId: txn.customerId,
        }),
      });
      const json = await res.json();
      toast({
        title: json.ok ? "Email queued" : "Email failed",
        description: json.message ?? "Check server configuration.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Email failed",
        description: "Could not reach the invoice API.",
      });
    } finally {
      setActionLoading(null);
    }
  };

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
        <PermissionGate permission="pos.receipt.print">
          <Button className="w-full" variant="outline" onClick={handlePrint}>
            Print receipt
          </Button>
        </PermissionGate>
        <PermissionGate permission="pos.invoice.email">
          <Button
            className="w-full"
            variant="outline"
            disabled={actionLoading === "email"}
            onClick={handleEmail}
          >
            {actionLoading === "email" ? "Sending…" : "Send email invoice"}
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
}
