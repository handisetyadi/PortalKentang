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
import { recipeInternalName, recipeTitle } from "@/lib/recipes/recipe-display";

export function RecipeDetail({ id }: { id: string }) {
  const { data, loading } = useAppData();
  if (loading) return <LoadingState />;
  const recipe = data?.recipes.find((r) => r.id === id);
  if (!recipe || !data) return <ErrorState message="Recipe not found" />;

  const items = data.recipeItems.filter((ri) => ri.recipeId === id);
  const byproducts = data.recipeByproducts.filter((bp) => bp.recipeId === id);
  const product = recipe.productId
    ? data.products.find((p) => p.id === recipe.productId)
    : undefined;
  const internalName = recipeInternalName(recipe, product);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>{recipeTitle(recipe, product)}</CardTitle>
          {internalName && (
            <p className="text-sm text-muted-foreground">{internalName}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Version:</span> {recipe.version}
          </p>
          <p>
            <span className="text-muted-foreground">Yield:</span> {recipe.outputQuantity}{" "}
            {recipe.outputUnit}
            {recipe.yieldFactor !== 1 && (
              <span className="text-muted-foreground"> · factor {recipe.yieldFactor}</span>
            )}
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
                <TableHead>Substitute</TableHead>
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
                    {ri.substituteInventoryItemId ? (
                      <span>
                        {data.inventoryItems.find((i) => i.id === ri.substituteInventoryItemId)
                          ?.name ?? "—"}
                        {ri.substituteQuantity != null && (
                          <span className="block text-muted-foreground">
                            {ri.substituteQuantity} {ri.substituteUnit ?? ""}
                          </span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
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
      {byproducts.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Byproducts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Byproduct</TableHead>
                  <TableHead>Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byproducts.map((bp) => (
                  <TableRow key={bp.id}>
                    <TableCell>
                      {bp.semiFinishedInventoryItemId
                        ? data.inventoryItems.find((i) => i.id === bp.semiFinishedInventoryItemId)
                            ?.name ?? "—"
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {bp.quantity} {bp.unit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
