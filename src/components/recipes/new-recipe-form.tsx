"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/hooks/use-app-data";
import { LoadingState } from "@/components/shared/LoadingState";
import {
  getRecipeEligibleMaterials,
  isKnownInventoryItem,
  isRecipeMaterialType,
} from "@/lib/recipes/eligible-materials";
import type { Recipe, RecipeItem } from "@/lib/data/types";
import { toast } from "@/hooks/use-toast";

const materialSchema = z.object({
  inventoryItemId: z.string().min(1, "Select a material"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit: z.string().min(1, "Unit is required"),
  isOptional: z.boolean(),
});

const schema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  productId: z.string().min(1, "Select a product"),
  outputQuantity: z.coerce.number().positive("Output quantity must be greater than zero"),
  outputUnit: z.string().min(1, "Output unit is required"),
  yieldFactor: z.coerce.number().min(0.01).max(2),
  materials: z.array(materialSchema).min(1, "Add at least one material"),
});

type FormValues = z.infer<typeof schema>;

export function NewRecipeForm() {
  const router = useRouter();
  const { data, persist, loading } = useAppData();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      productId: "",
      outputQuantity: 1,
      outputUnit: "pcs",
      yieldFactor: 1,
      materials: [{ inventoryItemId: "", quantity: 1, unit: "", isOptional: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  if (loading || !data) return <LoadingState />;

  const eligibleMaterials = getRecipeEligibleMaterials(data.inventoryItems);
  const recipeProducts = data.products.filter((p) => p.isActive && p.isRecipeBased);

  const onMaterialSelect = (index: number, inventoryItemId: string) => {
    form.setValue(`materials.${index}.inventoryItemId`, inventoryItemId);
    const item = data.inventoryItems.find((i) => i.id === inventoryItemId);
    if (item) {
      form.setValue(`materials.${index}.unit`, item.baseUnit);
    }
  };

  const validateMaterialsAgainstInventory = (values: FormValues): string | null => {
    const seen = new Set<string>();

    for (const line of values.materials) {
      if (!isKnownInventoryItem(data.inventoryItems, line.inventoryItemId)) {
        return "Each material must exist in your inventory items list.";
      }

      const item = data.inventoryItems.find((i) => i.id === line.inventoryItemId);
      if (!item || !isRecipeMaterialType(item.type)) {
        return "Materials must be raw materials or semi-finished goods from inventory.";
      }

      if (seen.has(line.inventoryItemId)) {
        return "Duplicate materials are not allowed in the same recipe.";
      }
      seen.add(line.inventoryItemId);
    }

    return null;
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const materialError = validateMaterialsAgainstInventory(values);
    if (materialError) {
      toast({ title: "Invalid materials", description: materialError, variant: "destructive" });
      return;
    }

    const productVersions = data.recipes
      .filter((r) => r.productId === values.productId)
      .map((r) => r.version);
    const version = productVersions.length > 0 ? Math.max(...productVersions) + 1 : 1;

    const recipeId = crypto.randomUUID();
    const recipe: Recipe = {
      id: recipeId,
      productId: values.productId,
      name: values.name.trim(),
      version,
      outputQuantity: values.outputQuantity,
      outputUnit: values.outputUnit,
      yieldFactor: values.yieldFactor,
      isActive: true,
    };

    const recipeItems: RecipeItem[] = values.materials.map((m) => ({
      id: crypto.randomUUID(),
      recipeId,
      inventoryItemId: m.inventoryItemId,
      quantity: m.quantity,
      unit: m.unit,
      conversionToBaseFactor: 1,
      isOptional: m.isOptional,
    }));

    await persist({
      ...data,
      recipes: [recipe, ...data.recipes],
      recipeItems: [...recipeItems, ...data.recipeItems],
    });

    toast({ title: "Recipe created", description: `${recipe.name} (v${version})` });
    router.push(`/recipes/${recipeId}`);
  });

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recipe details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Recipe name</Label>
            <Input id="name" placeholder="e.g. Latte" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Product</Label>
            <Select onValueChange={(v) => form.setValue("productId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipe-based product" />
              </SelectTrigger>
              <SelectContent>
                {recipeProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.productId && (
              <p className="text-sm text-destructive">{form.formState.errors.productId.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="outputQuantity">Output quantity</Label>
              <Input id="outputQuantity" type="number" step="any" {...form.register("outputQuantity")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outputUnit">Output unit</Label>
              <Input id="outputUnit" placeholder="cup, portion, pcs" {...form.register("outputUnit")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yieldFactor">Yield factor</Label>
              <Input id="yieldFactor" type="number" step="0.01" {...form.register("yieldFactor")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Materials</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ inventoryItemId: "", quantity: 1, unit: "", isOptional: false })
            }
          >
            <Plus className="h-4 w-4" />
            Add material
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose raw materials or semi-finished goods from inventory. Items with zero stock are
            allowed.
          </p>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_120px_100px_auto]"
            >
              <div className="space-y-2">
                <Label>Inventory item</Label>
                <Select
                  value={form.watch(`materials.${index}.inventoryItemId`) || undefined}
                  onValueChange={(v) => onMaterialSelect(index, v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleMaterials.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} ({i.sku}) — {i.type.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.materials?.[index]?.inventoryItemId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.materials[index]?.inventoryItemId?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="any"
                  {...form.register(`materials.${index}.quantity`)}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input {...form.register(`materials.${index}.unit`)} />
              </div>
              <div className="flex items-end justify-end pb-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={fields.length <= 1}
                  onClick={() => remove(index)}
                  aria-label="Remove material"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}

          {form.formState.errors.materials?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.materials.message}</p>
          )}

          {eligibleMaterials.length === 0 && (
            <p className="text-sm text-amber-600">
              No raw materials or semi-finished goods in inventory. Add inventory items first.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={eligibleMaterials.length === 0}>
          Save recipe
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/recipes")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
