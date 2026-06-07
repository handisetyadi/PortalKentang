import { z } from "zod";
import { hasInventoryItemName } from "./inventory-item-names";

export function createByproductFormSchema(items: { name: string }[]) {
  return z
    .object({
      name: z.string().min(1, "Name is required"),
      sku: z.string().min(1, "SKU is required"),
      baseUnit: z.string().min(1, "Unit is required"),
    })
    .superRefine((values, ctx) => {
      if (hasInventoryItemName(items, values.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "An inventory item with this name already exists",
          path: ["name"],
        });
      }
    });
}

export type ByproductFormValues = z.infer<ReturnType<typeof createByproductFormSchema>>;
