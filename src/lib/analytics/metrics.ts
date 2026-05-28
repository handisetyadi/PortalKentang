import type { AppData } from "@/lib/data/types";
import { subDays, isWithinInterval, parseISO } from "date-fns";

export function computeDashboardMetrics(data: AppData, days = 30) {
  const end = new Date();
  const start = subDays(end, days);
  const txns = data.transactions.filter((t) =>
    isWithinInterval(parseISO(t.createdAt), { start, end })
  );

  const grossSales = txns.reduce((s, t) => s + t.total, 0);
  const txnCount = txns.length;
  const aov = txnCount > 0 ? grossSales / txnCount : 0;
  const discountTotal = txns.reduce((s, t) => s + t.discountTotal, 0);
  const discountRate = grossSales > 0 ? (discountTotal / grossSales) * 100 : 0;
  const fifoCogs = txns.reduce((s, t) => s + t.fifoCogsTotal, 0);
  const grossMargin = grossSales > 0 ? ((grossSales - fifoCogs) / grossSales) * 100 : 0;

  const byDay = new Map<string, number>();
  txns.forEach((t) => {
    const d = t.createdAt.slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + t.total);
  });
  const salesTrend = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sales]) => ({ date, sales }));

  const productMix = new Map<string, number>();
  txns.forEach((t) =>
    t.items.forEach((i) => {
      productMix.set(i.productName, (productMix.get(i.productName) ?? 0) + i.lineTotal);
    })
  );
  const productMixData = Array.from(productMix.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const paymentSplit = new Map<string, number>();
  txns.forEach((t) =>
    t.payments.forEach((p) => {
      paymentSplit.set(p.method, (paymentSplit.get(p.method) ?? 0) + p.amount);
    })
  );

  return {
    grossSales,
    netSales: grossSales - discountTotal,
    txnCount,
    aov,
    discountRate,
    refundRate: 0,
    fifoCogs,
    grossMargin,
    salesTrend,
    productMixData,
    paymentSplit: Array.from(paymentSplit.entries()).map(([name, value]) => ({ name, value })),
  };
}
