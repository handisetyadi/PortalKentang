"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppData, InventoryItem } from "@/lib/data/types";
import { addInventoryItemAction } from "@/lib/inventory/add-inventory-item-action";
import {
  createInventoryItemFormSchema,
  type InventoryItemFormValues,
} from "@/lib/inventory/inventory-item-form-schema";
import { hasInventoryItemName } from "@/lib/inventory/inventory-item-names";
import {
  ADDABLE_INVENTORY_TYPES,
  INVENTORY_BASE_UNITS,
  nextInventorySku,
  type AddableInventoryType,
} from "@/lib/inventory/inventory-sku";
import { toast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<AddableInventoryType, string> = {
  retail_good: "Retail good",
  raw_material: "Raw material",
  semi_finished_good: "Semi finished good",
  supply: "Supply",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AppData;
  saveLocal: (data: AppData) => Promise<void>;
  refresh?: () => Promise<void>;
  onCreated?: (item: InventoryItem) => void;
};

const defaultValues: InventoryItemFormValues = {
  type: "raw_material",
  name: "",
  sku: "",
  baseUnit: "pcs",
  trackStock: true,
  price: undefined,
  categoryId: undefined,
};

export function AddInventoryItemDialog({
  open,
  onOpenChange,
  data,
  saveLocal,
  refresh,
  onCreated,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);

  const inventoryItemsRef = useRef(data.inventoryItems);
  const productsRef = useRef(data.products);
  useEffect(() => {
    inventoryItemsRef.current = data.inventoryItems;
    productsRef.current = data.products;
  }, [data.inventoryItems, data.products]);

  const resolver = useCallback<Resolver<InventoryItemFormValues>>(
    (values, context, options) =>
      zodResolver(
        createInventoryItemFormSchema(inventoryItemsRef.current, productsRef.current)
      )(values, context, options),
    []
  );

  const form = useForm<InventoryItemFormValues>({
    resolver,
    mode: "onTouched",
    defaultValues,
  });

  const watchedType = form.watch("type");
  const watchedName = form.watch("name");
  const isRetail = watchedType === "retail_good";

  const isDuplicateName = useMemo(
    () =>
      hasInventoryItemName(data.inventoryItems, watchedName) ||
      (isRetail &&
        data.products.some(
          (p) => p.name.trim().toLowerCase() === watchedName.trim().toLowerCase()
        )),
    [data.inventoryItems, data.products, watchedName, isRetail]
  );

  const resetDialog = () => {
    setIsSaving(false);
    form.reset(defaultValues);
  };

  useEffect(() => {
    if (!open) return;
    const type = form.getValues("type");
    form.setValue("sku", nextInventorySku(type, data.inventoryItems));
  }, [open, data.inventoryItems, form]);

  useEffect(() => {
    if (!open) return;
    form.setValue("sku", nextInventorySku(watchedType, data.inventoryItems));
    if (watchedType !== "retail_good") {
      form.setValue("price", undefined);
      form.setValue("categoryId", undefined);
    }
  }, [watchedType, open, data.inventoryItems, form]);

  const handleOpenChange = (next: boolean) => {
    if (!next) resetDialog();
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const result = await addInventoryItemAction(values);
      if (!result.ok) {
        if (result.message.toLowerCase().includes("name")) {
          form.setError("name", { type: "manual", message: result.message });
        }
        toast({
          title: "Could not add item",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      const nextData: AppData = {
        ...data,
        inventoryItems: [result.inventoryItem, ...data.inventoryItems],
        products: result.product ? [result.product, ...data.products] : data.products,
      };

      await saveLocal(nextData);
      if (refresh) await refresh();

      toast({
        title: "Item added",
        description: result.product
          ? `${result.inventoryItem.name} added to inventory and POS menu.`
          : `${result.inventoryItem.name} added to inventory.`,
      });
      onCreated?.(result.inventoryItem);
      handleOpenChange(false);
    } catch (e) {
      toast({
        title: "Could not add item",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add inventory item</DialogTitle>
            <DialogDescription>
              Register a new item. Retail goods are also added to the POS menu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inv-type">Type</Label>
              <Select
                value={watchedType}
                onValueChange={(v) =>
                  form.setValue("type", v as AddableInventoryType, { shouldValidate: true })
                }
              >
                <SelectTrigger id="inv-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ADDABLE_INVENTORY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-name">Name</Label>
              <Input id="inv-name" placeholder="e.g. Oat milk" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-sku">SKU</Label>
              <Input
                id="inv-sku"
                readOnly
                className="cursor-default bg-muted"
                {...form.register("sku")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-unit">Unit</Label>
              <Select
                value={form.watch("baseUnit")}
                onValueChange={(v) =>
                  form.setValue("baseUnit", v as InventoryItemFormValues["baseUnit"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="inv-unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_BASE_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.baseUnit && (
                <p className="text-sm text-destructive">{form.formState.errors.baseUnit.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="inv-track"
                checked={form.watch("trackStock")}
                onCheckedChange={(checked) =>
                  form.setValue("trackStock", checked === true, { shouldValidate: true })
                }
              />
              <Label htmlFor="inv-track" className="cursor-pointer font-normal">
                Track stock
              </Label>
            </div>

            {isRetail && !form.watch("trackStock") && (
              <p className="text-sm text-muted-foreground">
                Retail items sold on POS usually need stock tracking enabled.
              </p>
            )}

            {isRetail && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="inv-price">Selling price (IDR)</Label>
                  <Input
                    id="inv-price"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 25000"
                    {...form.register("price")}
                  />
                  {form.formState.errors.price &&
                    (form.formState.touchedFields.price || form.formState.isSubmitted) && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inv-category">Menu category</Label>
                  <Select
                    value={form.watch("categoryId") ?? ""}
                    onValueChange={(v) =>
                      form.setValue("categoryId", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="inv-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoryId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.categoryId.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || isDuplicateName}>
              {isSaving ? "Saving…" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
