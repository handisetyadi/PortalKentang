"use client";

import Link from "next/link";
import { useAppData } from "@/hooks/use-app-data";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { Badge } from "@/components/ui/badge";
import type { Recipe } from "@/lib/data/types";

export function RecipesList() {
  const { data, loading } = useAppData();
  if (loading || !data) return <LoadingState />;

  const columns: Column<Recipe>[] = [
    {
      key: "name",
      header: "Recipe",
      cell: (r) => (
        <Link href={`/recipes/${r.id}`} className="font-medium hover:underline">
          {r.name}
        </Link>
      ),
    },
    {
      key: "product",
      header: "Product",
      cell: (r) => data.products.find((p) => p.id === r.productId)?.name ?? "—",
    },
    { key: "version", header: "Version", cell: (r) => `v${r.version}` },
    {
      key: "active",
      header: "Status",
      cell: (r) => (
        <Badge variant={r.isActive ? "success" : "secondary"}>
          {r.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return <DataTable columns={columns} data={data.recipes} emptyTitle="No recipes" />;
}
