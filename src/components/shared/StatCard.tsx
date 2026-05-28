import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  format?: "currency" | "number" | "percent";
  change?: number;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, format = "number", change, icon: Icon, className }: StatCardProps) {
  const formatted =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
        ? `${formatNumber(value, 1)}%`
        : formatNumber(value, 0);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{formatted}</div>
        {change !== undefined && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              change >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change >= 0 ? "+" : ""}
            {formatNumber(change, 1)}% vs prior period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
