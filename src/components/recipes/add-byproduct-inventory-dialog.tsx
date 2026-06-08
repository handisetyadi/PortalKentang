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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppData, InventoryItem } from "@/lib/data/types";
import { collectInventoryBaseUnits } from "@/lib/inventory/base-units";
import {
  createByproductFormSchema,
  type ByproductFormValues,
} from "@/lib/inventory/byproduct-form-schema";
import { hasInventoryItemName } from "@/lib/inventory/inventory-item-names";
import { nextSemiFinishedSku } from "@/lib/inventory/semi-finished-sku";
import { toast } from "@/hooks/use-toast";
import type { PersistAppDataFn } from "@/hooks/use-app-data";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AppData;
  persist: PersistAppDataFn;
  onCreated: (item: InventoryItem) => void;
};

export function AddByproductInventoryDialog({
  open,
  onOpenChange,
  data,
  persist,
  onCreated,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const inventoryItemsRef = useRef(data.inventoryItems);
  useEffect(() => {
    inventoryItemsRef.current = data.inventoryItems;
  }, [data.inventoryItems]);

  const baseUnitOptions = useMemo(
    () => collectInventoryBaseUnits(data.inventoryItems),
    [data.inventoryItems],
  );
  const defaultBaseUnit = baseUnitOptions[0];

  const resolver = useCallback<Resolver<ByproductFormValues>>(
    (values, context, options) =>
      zodResolver(createByproductFormSchema(inventoryItemsRef.current))(
        values,
        context,
        options,
      ),
    [],
  );

  const form = useForm<ByproductFormValues>({
    resolver,
    mode: "onChange",
    defaultValues: { name: "", sku: "", baseUnit: defaultBaseUnit },
  });

  const watchedName = form.watch("name");
  const isDuplicateName = useMemo(
    () => hasInventoryItemName(data.inventoryItems, watchedName),
    [data.inventoryItems, watchedName],
  );

  const resetDialog = () => {
    setConfirmed(false);
    setIsSaving(false);
    form.reset({ name: "", sku: "", baseUnit: defaultBaseUnit });
  };

  useEffect(() => {
    if (open && confirmed) {
      form.setValue("sku", nextSemiFinishedSku(data.inventoryItems));
      const current = form.getValues("baseUnit");
      if (!baseUnitOptions.includes(current)) {
        form.setValue("baseUnit", defaultBaseUnit);
      }
      void form.trigger("name");
    }
  }, [open, confirmed, data.inventoryItems, baseUnitOptions, defaultBaseUnit, form]);

  const handleOpenChange = (next: boolean) => {
    if (!next) resetDialog();
    onOpenChange(next);
  };

  const onConfirmAdd = () => setConfirmed(true);

  const onSubmit = form.handleSubmit(async (values) => {
    const name = values.name.trim();

    if (hasInventoryItemName(data.inventoryItems, name)) {
      form.setError("name", {
        type: "manual",
        message: "An inventory item with this name already exists",
      });
      toast({
        title: "Name already in use",
        description: "Choose a different name for this byproduct.",
        variant: "destructive",
      });
      return;
    }

    const sku = nextSemiFinishedSku(data.inventoryItems);
    if (data.inventoryItems.some((i) => i.sku.toLowerCase() === sku.toLowerCase())) {
      toast({
        title: "SKU already exists",
        description: "Close and reopen the dialog to get a new SKU.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const item: InventoryItem = {
        id: crypto.randomUUID(),
        type: "semi_finished_good",
        sku,
        name,
        baseUnit: values.baseUnit.trim(),
        trackStock: true,
        trackExpiry: true,
        fifoCosting: true,
        isActive: true,
      };

      await persist({
        ...data,
        inventoryItems: [item, ...data.inventoryItems],
      });

      toast({ title: "Byproduct added to inventory", description: item.name });
      onCreated(item);
      handleOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {!confirmed ? (
          <>
            <DialogHeader>
              <DialogTitle>Add new byproduct to inventory?</DialogTitle>
              <DialogDescription>
                This byproduct is not in your inventory list yet. Confirm to register it as a
                semi-finished good so it can be selected on this recipe.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={onConfirmAdd}>
                Yes, add byproduct
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>New byproduct</DialogTitle>
              <DialogDescription>
                Semi-finished good — will appear in inventory and in the byproduct picker.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bp-name">Name</Label>
                <Input
                  id="bp-name"
                  placeholder="e.g. Steamed milk batch"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-sku">SKU</Label>
                <Input
                  id="bp-sku"
                  readOnly
                  className="cursor-default bg-muted"
                  {...form.register("sku")}
                />
                {form.formState.errors.sku && (
                  <p className="text-sm text-destructive">{form.formState.errors.sku.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-unit">Base unit</Label>
                <Select
                  value={form.watch("baseUnit") || undefined}
                  onValueChange={(v) => form.setValue("baseUnit", v, { shouldValidate: true })}
                >
                  <SelectTrigger id="bp-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {baseUnitOptions.map((unit) => (
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirmed(false)}>
                Back
              </Button>
              <Button type="submit" disabled={isSaving || isDuplicateName}>
                Save to inventory
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
