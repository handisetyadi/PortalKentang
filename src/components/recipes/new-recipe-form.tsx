"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAppData } from "@/hooks/use-app-data";
import { LoadingState } from "@/components/shared/LoadingState";
import {
  getRecipeByproductOptions,
  getRecipeEligibleMaterials,
  getRecipeRawMaterialOptions,
  isKnownInventoryItem,
  isRecipeMaterialType,
} from "@/lib/recipes/eligible-materials";
import type { InventoryItem, Recipe, RecipeByproduct, RecipeItem } from "@/lib/data/types";
import { linkRecipeToPosMenu } from "@/lib/recipes/create-recipe-product";
import { toast } from "@/hooks/use-toast";
import { AddByproductInventoryDialog } from "@/components/recipes/add-byproduct-inventory-dialog";

const materialSchema = z
  .object({
    inventoryItemId: z.string().min(1, "Select a material"),
    hasSubstitute: z.boolean(),
    substituteInventoryItemId: z.string().optional(),
    substituteQuantity: z.coerce.number().optional(),
    substituteUnit: z.string().optional(),
    quantity: z.coerce.number().positive("Quantity must be greater than zero"),
    unit: z.string().min(1, "Unit is required"),
    isOptional: z.boolean(),
  })
  .superRefine((row, ctx) => {
    if (!row.hasSubstitute) return;
    if (!row.substituteInventoryItemId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a semi-finished substitute",
        path: ["substituteInventoryItemId"],
      });
    }
    if (!row.substituteQuantity || row.substituteQuantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Substitute quantity must be greater than zero",
        path: ["substituteQuantity"],
      });
    }
    if (!row.substituteUnit?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Substitute unit is required",
        path: ["substituteUnit"],
      });
    }
  });

const byproductSchema = z.object({
  semiFinishedInventoryItemId: z.string().min(1, "Select a byproduct from inventory"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit: z.string().min(1, "Unit is required"),
});

const schema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  categoryId: z.string().min(1, "Select a menu category"),
  price: z.coerce.number().positive("Price must be greater than zero"),
  materials: z.array(materialSchema).min(1, "Add at least one material"),
  byproducts: z.array(byproductSchema),
});

type FormValues = z.infer<typeof schema>;

const emptyByproduct = {
  semiFinishedInventoryItemId: "",
  quantity: 1,
  unit: "",
};

/** Shared column layout for material and substitute lines (select | qty | unit | action). */
const materialLineGrid =
  "grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_100px_2.5rem] sm:items-end";

export function NewRecipeForm() {
  const router = useRouter();
  const { data, persist, loading } = useAppData();
  const [addByproductOpen, setAddByproductOpen] = useState(false);
  const [pendingByproductRowIndex, setPendingByproductRowIndex] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      categoryId: "",
      price: undefined,
      materials: [
        {
          inventoryItemId: "",
          hasSubstitute: false,
          substituteInventoryItemId: "",
          substituteQuantity: 1,
          substituteUnit: "",
          quantity: 1,
          unit: "",
          isOptional: false,
        },
      ],
      byproducts: [],
    },
  });

  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
  } = useFieldArray({
    control: form.control,
    name: "materials",
  });

  const {
    fields: byproductFields,
    append: appendByproduct,
    remove: removeByproduct,
  } = useFieldArray({
    control: form.control,
    name: "byproducts",
  });

  if (loading || !data) return <LoadingState />;

  const eligibleMaterials = getRecipeEligibleMaterials(data.inventoryItems);
  const byproductOptions = getRecipeByproductOptions(data.inventoryItems);
  const rawMaterialOptions = getRecipeRawMaterialOptions(data.inventoryItems);
  const sortedCategories = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const onMaterialSelect = (index: number, inventoryItemId: string) => {
    form.setValue(`materials.${index}.inventoryItemId`, inventoryItemId);
    const item = data.inventoryItems.find((i) => i.id === inventoryItemId);
    if (item) {
      form.setValue(`materials.${index}.unit`, item.baseUnit);
    }
    if (form.getValues(`materials.${index}.hasSubstitute`) && item?.type !== "raw_material") {
      form.setValue(`materials.${index}.hasSubstitute`, false);
      form.setValue(`materials.${index}.substituteInventoryItemId`, "");
      form.setValue(`materials.${index}.substituteQuantity`, 1);
      form.setValue(`materials.${index}.substituteUnit`, "");
    }
  };

  const onSubstituteSelect = (index: number, inventoryItemId: string) => {
    form.setValue(`materials.${index}.substituteInventoryItemId`, inventoryItemId);
    const item = data.inventoryItems.find((i) => i.id === inventoryItemId);
    if (item) {
      form.setValue(`materials.${index}.substituteUnit`, item.baseUnit);
    }
  };

  const onSubstituteToggle = (index: number, checked: boolean) => {
    form.setValue(`materials.${index}.hasSubstitute`, checked);
    if (!checked) {
      form.setValue(`materials.${index}.substituteInventoryItemId`, "");
      form.setValue(`materials.${index}.substituteQuantity`, 1);
      form.setValue(`materials.${index}.substituteUnit`, "");
      return;
    }
    if (!form.getValues(`materials.${index}.substituteQuantity`)) {
      form.setValue(`materials.${index}.substituteQuantity`, 1);
    }
    const item = data.inventoryItems.find(
      (i) => i.id === form.getValues(`materials.${index}.inventoryItemId`)
    );
    if (item && item.type !== "raw_material") {
      form.setValue(`materials.${index}.inventoryItemId`, "");
    }
  };

  const onByproductSelect = (index: number, inventoryItemId: string) => {
    form.setValue(`byproducts.${index}.semiFinishedInventoryItemId`, inventoryItemId);
    const item = data.inventoryItems.find((i) => i.id === inventoryItemId);
    const currentUnit = form.getValues(`byproducts.${index}.unit`);
    if (item && !currentUnit) {
      form.setValue(`byproducts.${index}.unit`, item.baseUnit);
    }
  };

  const openAddByproductDialog = (rowIndex: number | null) => {
    setPendingByproductRowIndex(rowIndex);
    setAddByproductOpen(true);
  };

  const onByproductInventoryCreated = (item: InventoryItem) => {
    if (pendingByproductRowIndex !== null) {
      onByproductSelect(pendingByproductRowIndex, item.id);
    } else {
      appendByproduct({
        ...emptyByproduct,
        semiFinishedInventoryItemId: item.id,
        unit: item.baseUnit,
      });
    }
    setPendingByproductRowIndex(null);
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

      if (line.hasSubstitute) {
        if (item.type !== "raw_material") {
          return "Substitute requires a raw material as the primary inventory item.";
        }
        const sub = data.inventoryItems.find((i) => i.id === line.substituteInventoryItemId);
        if (!sub || sub.type !== "semi_finished_good") {
          return "Substitute must be a semi-finished good from inventory.";
        }
      }

      if (seen.has(line.inventoryItemId)) {
        return "Duplicate materials are not allowed in the same recipe.";
      }
      seen.add(line.inventoryItemId);
    }

    return null;
  };

  const validateByproductsAgainstInventory = (values: FormValues): string | null => {
    const seenByproducts = new Set<string>();

    for (const line of values.byproducts) {
      const item = data.inventoryItems.find((i) => i.id === line.semiFinishedInventoryItemId);
      if (!item || item.type !== "semi_finished_good") {
        return "Each byproduct must be a semi-finished good registered in inventory.";
      }

      if (seenByproducts.has(line.semiFinishedInventoryItemId)) {
        return "Duplicate byproducts are not allowed in the same recipe.";
      }
      seenByproducts.add(line.semiFinishedInventoryItemId);
    }

    return null;
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const materialError = validateMaterialsAgainstInventory(values);
    if (materialError) {
      toast({ title: "Invalid materials", description: materialError, variant: "destructive" });
      return;
    }

    const byproductError = validateByproductsAgainstInventory(values);
    if (byproductError) {
      toast({ title: "Invalid byproducts", description: byproductError, variant: "destructive" });
      return;
    }

    if (!data.categories.some((c) => c.id === values.categoryId)) {
      toast({
        title: "Invalid category",
        description: "Select a valid menu category.",
        variant: "destructive",
      });
      return;
    }

    const normalizedName = values.name.trim();
    const nameVersions = data.recipes
      .filter((r) => r.name.trim().toLowerCase() === normalizedName.toLowerCase())
      .map((r) => r.version);
    const version = nameVersions.length > 0 ? Math.max(...nameVersions) + 1 : 1;

    const recipeId = crypto.randomUUID();
    const recipe: Recipe = {
      id: recipeId,
      name: normalizedName,
      version,
      outputQuantity: 1,
      outputUnit: "pcs",
      yieldFactor: 1,
      isActive: true,
    };

    const recipeItems: RecipeItem[] = values.materials.map((m) => ({
      id: crypto.randomUUID(),
      recipeId,
      inventoryItemId: m.inventoryItemId,
      substituteInventoryItemId:
        m.hasSubstitute && m.substituteInventoryItemId
          ? m.substituteInventoryItemId
          : undefined,
      substituteQuantity:
        m.hasSubstitute && m.substituteQuantity ? m.substituteQuantity : undefined,
      substituteUnit:
        m.hasSubstitute && m.substituteUnit?.trim() ? m.substituteUnit.trim() : undefined,
      quantity: m.quantity,
      unit: m.unit,
      conversionToBaseFactor: 1,
      isOptional: m.isOptional,
    }));

    const recipeByproducts: RecipeByproduct[] = values.byproducts.map((bp) => ({
      id: crypto.randomUUID(),
      recipeId,
      semiFinishedInventoryItemId: bp.semiFinishedInventoryItemId,
      quantity: bp.quantity,
      unit: bp.unit,
      expiryDays: 7,
      costAllocationPercent: 0,
    }));

    const { productId, products, updatedRecipes } = linkRecipeToPosMenu(data, {
      menuName: normalizedName,
      categoryId: values.categoryId,
      price: values.price,
    });

    await persist({
      ...data,
      products,
      recipes: [{ ...recipe, productId }, ...updatedRecipes],
      recipeItems: [...recipeItems, ...data.recipeItems],
      recipeByproducts: [...recipeByproducts, ...data.recipeByproducts],
    });

    toast({
      title: "Recipe created",
      description: `${recipe.name} (v${version}) added to POS menu.`,
    });
    router.push(`/recipes/${recipeId}`);
  });

  return (
    <>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Menu category</Label>
                <Select
                  value={form.watch("categoryId") || undefined}
                  onValueChange={(v) => form.setValue("categoryId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
                {sortedCategories.length === 0 && (
                  <p className="text-sm text-amber-600">
                    No menu categories configured. Add categories before creating recipes.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Selling price</Label>
                <Input
                  id="price"
                  type="number"
                  step="any"
                  placeholder="e.g. 32000"
                  {...form.register("price")}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                )}
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
                appendMaterial({
                  inventoryItemId: "",
                  hasSubstitute: false,
                  substituteInventoryItemId: "",
                  substituteQuantity: 1,
                  substituteUnit: "",
                  quantity: 1,
                  unit: "",
                  isOptional: false,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add material
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose raw materials or semi-finished goods from inventory. Enable substitute to
              allow a semi-finished good to replace the raw material when stock is available (used
              first in sales).
            </p>

            {materialFields.map((field, index) => {
              const hasSubstitute = form.watch(`materials.${index}.hasSubstitute`);
              const materialOptions = hasSubstitute ? rawMaterialOptions : eligibleMaterials;

              return (
                <div key={field.id} className="space-y-3 rounded-lg border p-4">
                  <div className={materialLineGrid}>
                    <div className="space-y-2">
                      <Label>{hasSubstitute ? "Raw material" : "Inventory item"}</Label>
                      <Select
                        value={form.watch(`materials.${index}.inventoryItemId`) || undefined}
                        onValueChange={(v) => onMaterialSelect(index, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materialOptions.map((i) => (
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
                        disabled={materialFields.length <= 1}
                        onClick={() => removeMaterial(index)}
                        aria-label="Remove material"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`substitute-${field.id}`}
                        checked={hasSubstitute}
                        onCheckedChange={(checked) =>
                          onSubstituteToggle(index, checked === true)
                        }
                      />
                      <Label htmlFor={`substitute-${field.id}`} className="font-normal">
                        Substitute
                      </Label>
                    </div>
                    {hasSubstitute && (
                      <div className={materialLineGrid}>
                        <div className="space-y-2">
                          <Label>Semi-finished goods Substitute</Label>
                          <Select
                            value={
                              form.watch(`materials.${index}.substituteInventoryItemId`) ||
                              undefined
                            }
                            onValueChange={(v) => onSubstituteSelect(index, v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select semi-finished good" />
                            </SelectTrigger>
                            <SelectContent>
                              {byproductOptions.map((i) => (
                                <SelectItem key={i.id} value={i.id}>
                                  {i.name} ({i.sku})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.materials?.[index]
                            ?.substituteInventoryItemId && (
                            <p className="text-sm text-destructive">
                              {
                                form.formState.errors.materials[index]
                                  ?.substituteInventoryItemId?.message
                              }
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            step="any"
                            {...form.register(`materials.${index}.substituteQuantity`)}
                          />
                          {form.formState.errors.materials?.[index]?.substituteQuantity && (
                            <p className="text-sm text-destructive">
                              {
                                form.formState.errors.materials[index]?.substituteQuantity
                                  ?.message
                              }
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Input {...form.register(`materials.${index}.substituteUnit`)} />
                          {form.formState.errors.materials?.[index]?.substituteUnit && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.materials[index]?.substituteUnit?.message}
                            </p>
                          )}
                        </div>
                        <div className="flex items-end justify-end pb-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onSubstituteToggle(index, false)}
                            aria-label="Remove substitute"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Byproduct</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendByproduct(emptyByproduct)}
            >
              <Plus className="h-4 w-4" />
              Add byproduct
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {byproductFields.length === 0 && (
              <p className="text-sm text-muted-foreground">No byproducts added.</p>
            )}

            {byproductFields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-lg border p-4">
                <div className={materialLineGrid}>
                  <div className="space-y-2">
                    <Label>Byproduct</Label>
                    <Select
                      value={
                        form.watch(`byproducts.${index}.semiFinishedInventoryItemId`) || undefined
                      }
                      onValueChange={(v) => onByproductSelect(index, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select from inventory" />
                      </SelectTrigger>
                      <SelectContent>
                        {byproductOptions.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} ({i.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.byproducts?.[index]?.semiFinishedInventoryItemId && (
                      <p className="text-sm text-destructive">
                        {
                          form.formState.errors.byproducts[index]?.semiFinishedInventoryItemId
                            ?.message
                        }
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      step="any"
                      {...form.register(`byproducts.${index}.quantity`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input {...form.register(`byproducts.${index}.unit`)} />
                  </div>
                  <div className="flex items-end justify-end pb-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeByproduct(index)}
                      aria-label="Remove byproduct"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => openAddByproductDialog(index)}
                >
                  Byproduct not listed? Register new…
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openAddByproductDialog(null)}
            >
              Register new byproduct in inventory
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={eligibleMaterials.length === 0 || sortedCategories.length === 0}
          >
            Save recipe
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/recipes")}>
            Cancel
          </Button>
        </div>
      </form>

      <AddByproductInventoryDialog
        open={addByproductOpen}
        onOpenChange={setAddByproductOpen}
        data={data}
        persist={persist}
        onCreated={onByproductInventoryCreated}
      />
    </>
  );
}
