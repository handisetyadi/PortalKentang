"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/hooks/use-app-data";
import { computeDashboardMetrics } from "@/lib/analytics/metrics";
import { formatCurrency } from "@/lib/utils";
import { LoadingState } from "@/components/shared/LoadingState";
import { PermissionGate } from "@/components/gates/PermissionGate";

export function ReportsView() {
  const { data, loading } = useAppData();
  if (loading || !data) return <LoadingState />;
  const m = computeDashboardMetrics(data, 90);

  return (
    <PermissionGate
      permission="finance.view"
      fallback={<p className="text-sm text-muted-foreground">Finance permission required.</p>}
    >
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="cogs">FIFO COGS</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="mt-4">
          {m.txnCount < 2 && (
            <p className="mb-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Not enough sales data yet for trend charts. Complete more POS transactions to see
              richer reports.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gross sales (90d)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{formatCurrency(m.grossSales)}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transactions</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{m.txnCount}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Discount rate</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{m.discountRate.toFixed(1)}%</CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="cogs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">FIFO COGS & margin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>COGS: {formatCurrency(m.fifoCogs)}</p>
              <p>Gross margin: {m.grossMargin.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stock movements</CardTitle>
            </CardHeader>
            <CardContent>{data.stockLedger.length} ledger entries recorded.</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PermissionGate>
  );
}
