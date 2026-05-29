"use client";

import { useAppData } from "@/hooks/use-app-data";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function RecipeDetail({ id }: { id: string }) {
  const { data, loading } = useAppData();
  if (loading) return <LoadingState />;
  const recipe = data?.recipes.find((r) => r.id === id);
  if (!recipe || !data) return <ErrorState message="Recipe not found" />;

  const items = data.recipeItems.filter((ri) => ri.recipeId === id);
  const product = data.products.find((p) => p.id === recipe.productId);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{recipe.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Product:</span> {product?.name}
          </p>
          <p>
            <span className="text-muted-foreground">Version:</span> {recipe.version}
          </p>
          <p>
            <span className="text-muted-foreground">Yield:</span> {recipe.yieldFactor}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Modifier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((ri) => (
                <TableRow key={ri.id}>
                  <TableCell>
                    {data.inventoryItems.find((i) => i.id === ri.inventoryItemId)?.name}
                  </TableCell>
                  <TableCell>
                    {ri.quantity} {ri.unit}
                  </TableCell>
                  <TableCell>
                    {ri.modifierId
                      ? data.modifiers.find((m) => m.id === ri.modifierId)?.name
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
