import type { AppData, Product, Recipe } from "@/lib/data/types";

export const DEFAULT_TAX_RATE = 0.11;

const BEV_PREFIX = "BEV-";
const BEV_DIGITS = 5;

function normalizeRecipeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Next unique menu SKU for recipe-based products (BEV-00001, …). */
export function nextRecipeProductSku(products: { sku: string }[]): string {
  const pattern = new RegExp(`^${BEV_PREFIX.replace("-", "\\-")}(\\d+)$`, "i");
  let max = 0;
  for (const item of products) {
    const match = item.sku.trim().match(pattern);
    if (!match) continue;
    const n = parseInt(match[1], 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `${BEV_PREFIX}${String(max + 1).padStart(BEV_DIGITS, "0")}`;
}

export function linkRecipeToPosMenu(
  data: Pick<AppData, "products" | "recipes">,
  params: {
    menuName: string;
    categoryId: string;
    price: number;
  }
): {
  productId: string;
  products: Product[];
  updatedRecipes: Recipe[];
  isNewProduct: boolean;
} {
  const menuName = params.menuName.trim();
  const normalizedName = normalizeRecipeName(menuName);

  const priorLinkedRecipe = data.recipes.find(
    (r) => normalizeRecipeName(r.name) === normalizedName && r.productId
  );
  const existingProduct = priorLinkedRecipe?.productId
    ? data.products.find((p) => p.id === priorLinkedRecipe.productId)
    : undefined;

  let productId: string;
  let isNewProduct = false;
  let products: Product[];

  if (existingProduct) {
    productId = existingProduct.id;
    products = data.products.map((p) =>
      p.id === productId
        ? { ...p, name: menuName, categoryId: params.categoryId, price: params.price }
        : p
    );
  } else {
    isNewProduct = true;
    productId = crypto.randomUUID();
    const newProduct: Product = {
      id: productId,
      categoryId: params.categoryId,
      name: menuName,
      sku: nextRecipeProductSku(data.products),
      price: params.price,
      taxRate: DEFAULT_TAX_RATE,
      isRecipeBased: true,
      isActive: true,
    };
    products = [newProduct, ...data.products];
  }

  const updatedRecipes = data.recipes.map((r) => {
    if (r.productId === productId && r.isActive) {
      return { ...r, isActive: false };
    }
    return r;
  });

  return { productId, products, updatedRecipes, isNewProduct };
}
