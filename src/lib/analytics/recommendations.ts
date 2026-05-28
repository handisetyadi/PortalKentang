import type { AppData } from "@/lib/data/types";
import { getAvailableQty } from "@/lib/inventory/fifo";
import { IDS } from "@/lib/data/ids";

export interface Recommendation {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  href?: string;
}

export function buildRecommendations(data: AppData): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const item of data.inventoryItems) {
    if (!item.trackStock || !item.reorderPoint) continue;
    const onHand = getAvailableQty(data, item.id, IDS.outlet1);
    const daysLeft = onHand / (item.reorderPoint / 7);
    if (daysLeft < 3) {
      recs.push({
        id: `low-${item.id}`,
        severity: daysLeft < 1 ? "critical" : "warning",
        title: `${item.name} may run out soon`,
        description: `~${daysLeft.toFixed(1)} days of stock at current usage. On hand: ${onHand.toFixed(0)} ${item.baseUnit}.`,
        href: "/inventory/stock-on-hand",
      });
    }
  }

  for (const layer of data.fifoLayers) {
    if (!layer.expiresAt) continue;
    const hours = (new Date(layer.expiresAt).getTime() - Date.now()) / 3600000;
    if (hours > 0 && hours < 48) {
      const item = data.inventoryItems.find((i) => i.id === layer.inventoryItemId);
      recs.push({
        id: `exp-${layer.id}`,
        severity: hours < 24 ? "critical" : "warning",
        title: `Expiring: ${item?.name ?? "Batch"}`,
        description: `Batch ${layer.batchCode ?? layer.id.slice(0, 8)} expires in ${hours.toFixed(0)} hours.`,
        href: "/inventory/stock-on-hand",
      });
    }
  }

  const txns = data.transactions;
  const productStats = new Map<string, { sales: number; cogs: number }>();
  txns.forEach((t) =>
    t.items.forEach((i) => {
      const cur = productStats.get(i.productName) ?? { sales: 0, cogs: 0 };
      cur.sales += i.lineTotal;
      cur.cogs += i.fifoCogs;
      productStats.set(i.productName, cur);
    })
  );
  productStats.forEach((stats, name) => {
    const margin = stats.sales > 0 ? ((stats.sales - stats.cogs) / stats.sales) * 100 : 0;
    if (stats.sales > 100000 && margin < 40) {
      recs.push({
        id: `margin-${name}`,
        severity: "info",
        title: `${name}: high sales, low margin`,
        description: `Margin ${margin.toFixed(1)}% on ${(stats.sales / 1000).toFixed(0)}k sales.`,
        href: "/reports",
      });
    }
  });

  data.customers
    .filter((c) => c.totalSpend > 500000)
    .forEach((c) => {
      if (!c.lastVisitAt) return;
      const daysSince = (Date.now() - new Date(c.lastVisitAt).getTime()) / 86400000;
      if (daysSince > 14) {
        recs.push({
          id: `crm-${c.id}`,
          severity: "info",
          title: `Reconnect with ${c.name}`,
          description: `High-value customer inactive ${Math.floor(daysSince)} days.`,
          href: `/customers/${c.id}`,
        });
      }
    });

  return recs.slice(0, 8);
}
