"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useAppData } from "@/hooks/use-app-data";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { computeDashboardMetrics } from "@/lib/analytics/metrics";
import { buildRecommendations } from "@/lib/analytics/recommendations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Banknote, ShoppingBag, TrendingUp, Percent } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "#94a3b8", "#f59e0b", "#ec4899"];

export function DashboardView() {
  const { data, loading } = useAppData();
  if (loading || !data) return <LoadingState />;
  const m = computeDashboardMetrics(data);
  const recs = buildRecommendations(data);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Gross sales" value={m.grossSales} format="currency" icon={Banknote} />
        <StatCard title="Transactions" value={m.txnCount} icon={ShoppingBag} />
        <StatCard title="AOV" value={m.aov} format="currency" icon={TrendingUp} />
        <StatCard title="Gross margin" value={m.grossMargin} format="percent" icon={Percent} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={m.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`Rp ${v.toLocaleString("id-ID")}`, "Sales"]} />
                <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product mix</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.productMixData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment methods</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={m.paymentSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {m.paymentSplit.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recs.map((r) => (
              <div key={r.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      r.severity === "critical"
                        ? "destructive"
                        : r.severity === "warning"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {r.severity}
                  </Badge>
                  {r.href ? (
                    <Link href={r.href} className="font-medium hover:underline">
                      {r.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{r.title}</span>
                  )}
                </div>
                <p className="mt-1 text-muted-foreground">{r.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
