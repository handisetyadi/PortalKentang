import { describe, expect, it } from "vitest";
import { collectInventoryBaseUnits } from "./base-units";

describe("collectInventoryBaseUnits", () => {
  it("returns sorted unique units from inventory", () => {
    expect(
      collectInventoryBaseUnits([
        { baseUnit: "pcs" },
        { baseUnit: "g" },
        { baseUnit: "ml" },
        { baseUnit: "g" },
      ]),
    ).toEqual(["g", "ml", "pcs"]);
  });

  it("defaults to pcs when inventory is empty", () => {
    expect(collectInventoryBaseUnits([])).toEqual(["pcs"]);
  });
});
