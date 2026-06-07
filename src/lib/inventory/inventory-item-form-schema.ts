import { z } from "zod";
import { hasInventoryItemName } from "./inventory-item-names";
import { parsePriceInput } from "./parse-price-input";
import { ADDABLE_INVENTORY_TYPES, INVENTORY_BASE_UNITS } from "./inventory-sku";

export function createInventoryItemFormSchema(
  inventoryItems: { name: string }[],
  products: { name: string }[] = []
) {
  return z
    .object({
      type: z.enum(ADDABLE_INVENTORY_TYPES),
      name: z.string().min(1, "Name is required"),
      sku: z.string().min(1, "SKU is required"),
      baseUnit: z.enum(INVENTORY_BASE_UNITS, { message: "Unit is required" }),
      trackStock: z.boolean(),
      price: z.preprocess(
        (val) => parsePriceInput(val),
        z.number().positive("Selling price must be greater than zero").optional()
      ),
      categoryId: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (hasInventoryItemName(inventoryItems, values.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "An inventory item with this name already exists",
          path: ["name"],
        });
      }
      if (values.type === "retail_good") {
        if (products.some((p) => p.name.trim().toLowerCase() === values.name.trim().toLowerCase())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A menu product with this name already exists",
            path: ["name"],
          });
        }
        if (values.price == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Selling price is required for retail goods",
            path: ["price"],
          });
        }
        if (!values.categoryId?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Menu category is required for retail goods",
            path: ["categoryId"],
          });
        }
      }
    });
}

export type InventoryItemFormValues = z.infer<ReturnType<typeof createInventoryItemFormSchema>>;
