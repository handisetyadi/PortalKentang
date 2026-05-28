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
          <p>Total spend: {formatCurrency(customer.totalSpend)}</p>
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
                <span>{t.receiptNumber}</span>
                <span>{formatCurrency(t.total)}</span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
