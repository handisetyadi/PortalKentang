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

  const pointsEarned = txns.reduce((s, t) => s + (t.pointsEarned ?? 0), 0);
  const pointsRedeemed = txns.reduce((s, t) => s + (t.pointsRedeemed ?? 0), 0);
  const voucherDiscountTotal = txns.reduce((s, t) => s + (t.voucherDiscount ?? 0), 0);
  const voucherRedemptionCount = txns.filter((t) => (t.voucherDiscount ?? 0) > 0).length;

  const voucherUsage = new Map<string, { count: number; discount: number }>();
  txns.forEach((t) => {
    if (!t.voucherCode || (t.voucherDiscount ?? 0) <= 0) return;
    const cur = voucherUsage.get(t.voucherCode) ?? { count: 0, discount: 0 };
    voucherUsage.set(t.voucherCode, {
      count: cur.count + 1,
      discount: cur.discount + (t.voucherDiscount ?? 0),
    });
  });
  const voucherUsageData = Array.from(voucherUsage.entries())
    .map(([code, stats]) => ({ code, ...stats }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const pointsByDay = new Map<string, number>();
  txns.forEach((t) => {
    if ((t.pointsRedeemed ?? 0) <= 0) return;
    const d = t.createdAt.slice(0, 10);
    pointsByDay.set(d, (pointsByDay.get(d) ?? 0) + (t.pointsRedeemed ?? 0));
  });
  const pointRedemptionTrend = Array.from(pointsByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, points]) => ({ date, points }));

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
    pointsEarned,
    pointsRedeemed,
    voucherDiscountTotal,
    voucherRedemptionCount,
    voucherUsageData,
    pointRedemptionTrend,
  };
}
