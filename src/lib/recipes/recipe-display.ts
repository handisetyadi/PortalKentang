import type { Product, Recipe } from "@/lib/data/types";

/** Menu-facing label: linked product name, or the recipe name when unlinked. */
export function recipeTitle(recipe: Recipe, product?: Product): string {
  return product?.name ?? recipe.name;
}

/** Internal recipe name when it differs from the linked product (e.g. kitchen alias vs menu name). */
export function recipeInternalName(recipe: Recipe, product?: Product): string | null {
  if (!product) return null;
  if (recipe.name.trim().toLowerCase() === product.name.trim().toLowerCase()) return null;
  return recipe.name;
}
