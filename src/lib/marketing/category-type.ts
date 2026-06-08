import type { LoyaltyRedeemType, Product, ProductCategory } from "@/lib/data/types";

const TYPE_KEYWORDS: Record<Exclude<LoyaltyRedeemType, "specific_product">, string[]> = {
  beverage: ["coffee", "beverage", "minuman", "drink", "tea"],
  food: ["food", "makanan", "snack", "pastry"],
  retail: ["retail", "merchandise", "souvenir"],
};

export function categoryNameMatchesRedeemType(
  categoryName: string,
  redeemType: Exclude<LoyaltyRedeemType, "specific_product">
): boolean {
  const normalized = categoryName.trim().toLowerCase();
  return TYPE_KEYWORDS[redeemType].some(
    (keyword) => normalized === keyword || normalized.includes(keyword)
  );
}

export function productMatchesLoyaltyRule(
  product: Product,
  redeemType: LoyaltyRedeemType,
  productId: string | undefined,
  categories: ProductCategory[]
): boolean {
  if (redeemType === "specific_product") {
    return productId != null && product.id === productId;
  }
  const category = categories.find((c) => c.id === product.categoryId);
  if (!category) return false;
  return categoryNameMatchesRedeemType(category.name, redeemType);
}
