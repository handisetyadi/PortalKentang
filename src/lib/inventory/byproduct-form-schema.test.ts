import { describe, expect, it } from "vitest";
import { createByproductFormSchema } from "./byproduct-form-schema";

describe("createByproductFormSchema", () => {
  it("rejects a name that already exists on inventory", () => {
    const schema = createByproductFormSchema([{ name: "Steamed milk batch" }]);
    const result = schema.safeParse({
      name: "steamed milk batch",
      sku: "SF-00002",
      baseUnit: "ml",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "An inventory item with this name already exists",
      );
    }
  });

  it("accepts a unique name", () => {
    const schema = createByproductFormSchema([{ name: "Steamed milk batch" }]);
    const result = schema.safeParse({
      name: "Oat milk batch",
      sku: "SF-00002",
      baseUnit: "ml",
    });
    expect(result.success).toBe(true);
  });
});
