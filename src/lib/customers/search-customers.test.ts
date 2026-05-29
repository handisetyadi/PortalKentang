import { describe, expect, it } from "vitest";
import { filterCustomers, matchesCustomerSearch } from "./search-customers";
import type { Customer } from "@/lib/data/types";

const sample: Pick<Customer, "name" | "phone" | "tags"> = {
  name: "Budi Santoso",
  phone: "+6281234567890",
  tags: ["regular"],
};

describe("search-customers", () => {
  it("matches by name", () => {
    expect(matchesCustomerSearch(sample, "budi")).toBe(true);
    expect(matchesCustomerSearch(sample, "xyz")).toBe(false);
  });

  it("matches by mobile digits without formatting", () => {
    expect(matchesCustomerSearch(sample, "081234")).toBe(true);
    expect(matchesCustomerSearch(sample, "628123")).toBe(true);
  });

  it("filters a list", () => {
    const list = [
      sample,
      { name: "Siti", phone: "+6289876543210", tags: [] as string[] },
    ];
    expect(filterCustomers(list, "siti")).toHaveLength(1);
    expect(filterCustomers(list, "98765")).toHaveLength(1);
  });
});
