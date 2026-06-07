import { IDS, LEGACY_ID_MAP, resolveId } from "./ids";
import type { AppData } from "./types";

const now = () => new Date().toISOString();

export function createMockSeed(): AppData {
  const catCoffee = IDS.catCoffee;
  const catFood = IDS.catFood;
  const catRetail = IDS.catRetail;

  const products = [
    { id: "p1", categoryId: catCoffee, name: "Espresso", sku: "BEV-001", barcode: "899001", price: 18000, taxRate: 0.11, isRecipeBased: true, isActive: true, description: "Single shot" },
    { id: "p2", categoryId: catCoffee, name: "Latte", sku: "BEV-002", barcode: "899002", price: 32000, taxRate: 0.11, isRecipeBased: true, isActive: true },
    { id: "p3", categoryId: catCoffee, name: "Cappuccino", sku: "BEV-003", barcode: "899003", price: 30000, taxRate: 0.11, isRecipeBased: true, isActive: true },
    { id: "p4", categoryId: catFood, inventoryItemId: "i6", name: "Croissant", sku: "FD-001", barcode: "899101", price: 22000, taxRate: 0.11, isRecipeBased: false, isActive: true },
    { id: "p5", categoryId: catFood, name: "Kentang Goreng", sku: "FD-002", barcode: "899102", price: 25000, taxRate: 0.11, isRecipeBased: true, isActive: true },
    { id: "p6", categoryId: catRetail, inventoryItemId: "i7", name: "Tumbler Kentang", sku: "RTL-001", barcode: "899201", price: 89000, taxRate: 0.11, isRecipeBased: false, isActive: true },
    { id: "p7", categoryId: catCoffee, name: "Americano", sku: "BEV-004", price: 20000, taxRate: 0.11, isRecipeBased: true, isActive: true },
    { id: "p8", categoryId: catFood, inventoryItemId: "i10", name: "Sandwich Club", sku: "FD-003", price: 45000, taxRate: 0.11, isRecipeBased: false, isActive: true },
  ];

  const variants = [
    { id: "v1", productId: "p2", name: "Large", sku: "BEV-002-L", priceDelta: 5000, isActive: true },
    { id: "v2", productId: "p2", name: "Small", sku: "BEV-002-S", priceDelta: -3000, isActive: true },
  ];

  const modifierGroups = [
    { id: "mg1", name: "Milk", minSelect: 0, maxSelect: 1, productIds: ["p2", "p3"] },
    { id: "mg2", name: "Extra shot", minSelect: 0, maxSelect: 2, productIds: ["p1", "p2", "p3", "p7"] },
  ];

  const modifiers = [
    { id: "m1", groupId: "mg1", name: "Oat milk", priceDelta: 5000, isActive: true },
    { id: "m2", groupId: "mg1", name: "Almond milk", priceDelta: 6000, isActive: true },
    { id: "m3", groupId: "mg2", name: "Extra espresso", priceDelta: 8000, isActive: true },
  ];

  const inventoryItems = [
    { id: "i1", type: "raw_material" as const, sku: "RM-001", name: "Coffee beans Arabica", baseUnit: "g", trackStock: true, trackExpiry: false, fifoCosting: true, reorderPoint: 5000, isActive: true },
    { id: "i2", type: "raw_material" as const, sku: "RM-002", name: "Fresh milk", baseUnit: "ml", trackStock: true, trackExpiry: true, fifoCosting: true, reorderPoint: 10000, isActive: true },
    { id: "i3", type: "raw_material" as const, sku: "RM-003", name: "Oat milk", baseUnit: "ml", trackStock: true, trackExpiry: true, fifoCosting: true, reorderPoint: 5000, isActive: true },
    { id: "i4", type: "raw_material" as const, sku: "RM-004", name: "Potato fresh", baseUnit: "g", trackStock: true, trackExpiry: true, fifoCosting: true, reorderPoint: 8000, isActive: true },
    { id: "i5", type: "semi_finished_good" as const, sku: "SF-001", name: "Croissant dough batch", baseUnit: "pcs", trackStock: true, trackExpiry: true, fifoCosting: true, reorderPoint: 20, isActive: true },
    { id: "i6", type: "retail_good" as const, sku: "FG-001", name: "Croissant baked", baseUnit: "pcs", trackStock: true, trackExpiry: true, fifoCosting: true, isActive: true },
    { id: "i7", type: "retail_good" as const, sku: "RTL-001", name: "Tumbler stock", baseUnit: "pcs", trackStock: true, trackExpiry: false, fifoCosting: true, reorderPoint: 5, isActive: true },
    { id: "i8", type: "supply" as const, sku: "SUP-001", name: "Paper cup 8oz", baseUnit: "pcs", trackStock: true, trackExpiry: false, fifoCosting: true, reorderPoint: 200, isActive: true },
    { id: "i9", type: "service_non_stock" as const, sku: "SVC-001", name: "Delivery fee", baseUnit: "order", trackStock: false, trackExpiry: false, fifoCosting: false, isActive: true },
    { id: "i10", type: "retail_good" as const, sku: "FD-003", name: "Sandwich Club", baseUnit: "pcs", trackStock: true, trackExpiry: true, fifoCosting: true, reorderPoint: 10, isActive: true },
  ];

  const fifoLayers = [
    { id: "f1", outletId: IDS.outlet1, warehouseId: IDS.warehouse1, inventoryItemId: "i1", batchCode: "BATCH-COFFEE-01", quantityReceived: 10000, quantityRemaining: 7200, unitCost: 0.12, receivedAt: now(), expiresAt: undefined },
    { id: "f2", outletId: IDS.outlet1, warehouseId: IDS.warehouse1, inventoryItemId: "i2", batchCode: "MILK-240527", quantityReceived: 20000, quantityRemaining: 8500, unitCost: 0.008, receivedAt: now(), expiresAt: new Date(Date.now() + 3 * 86400000).toISOString() },
    { id: "f3", outletId: IDS.outlet1, warehouseId: IDS.warehouse1, inventoryItemId: "i4", quantityReceived: 15000, quantityRemaining: 12000, unitCost: 0.015, receivedAt: now() },
    { id: "f4", outletId: IDS.outlet1, warehouseId: IDS.warehouse1, inventoryItemId: "i7", quantityReceived: 24, quantityRemaining: 18, unitCost: 45000, receivedAt: now() },
    { id: "f5", outletId: IDS.outlet1, warehouseId: IDS.warehouse1, inventoryItemId: "i5", batchCode: "DOUGH-240526", quantityReceived: 30, quantityRemaining: 8, unitCost: 3500, receivedAt: now(), expiresAt: new Date(Date.now() + 86400000).toISOString() },
    { id: "f6", outletId: IDS.outlet1, warehouseId: IDS.warehouse1, inventoryItemId: "i6", batchCode: "CROISSANT-240601", quantityReceived: 40, quantityRemaining: 12, unitCost: 8500, receivedAt: now(), expiresAt: new Date(Date.now() + 2 * 86400000).toISOString() },
    { id: "f7", outletId: IDS.outlet1, warehouseId: IDS.warehouse1, inventoryItemId: "i10", batchCode: "SANDWICH-240601", quantityReceived: 20, quantityRemaining: 15, unitCost: 22000, receivedAt: now(), expiresAt: new Date(Date.now() + 86400000).toISOString() },
  ];

  const recipes = [
    { id: "r1", productId: "p1", name: "Espresso", version: 1, outputQuantity: 1, outputUnit: "shot", yieldFactor: 1, isActive: true },
    { id: "r2", productId: "p2", name: "Latte", version: 2, outputQuantity: 1, outputUnit: "cup", yieldFactor: 1, isActive: true },
    { id: "r3", productId: "p5", name: "Kentang Goreng", version: 1, outputQuantity: 1, outputUnit: "portion", yieldFactor: 0.95, isActive: true },
  ];

  const recipeItems = [
    { id: "ri1", recipeId: "r1", inventoryItemId: "i1", quantity: 18, unit: "g", conversionToBaseFactor: 1, isOptional: false },
    { id: "ri2", recipeId: "r2", inventoryItemId: "i1", quantity: 18, unit: "g", conversionToBaseFactor: 1, isOptional: false },
    { id: "ri3", recipeId: "r2", inventoryItemId: "i2", quantity: 200, unit: "ml", conversionToBaseFactor: 1, isOptional: false },
    { id: "ri4", recipeId: "r2", inventoryItemId: "i3", modifierId: "m1", quantity: 200, unit: "ml", conversionToBaseFactor: 1, isOptional: false },
    { id: "ri5", recipeId: "r3", inventoryItemId: "i4", quantity: 150, unit: "g", conversionToBaseFactor: 1, isOptional: false },
  ];

  const customers = [
    { id: "cu1", name: "Budi Santoso", phone: "+6281234567890", email: "budi@example.com", tags: ["regular"], whatsappOptIn: true, emailOptIn: true, totalSpend: 1250000, lastVisitAt: now() },
    { id: "cu2", name: "Siti Rahayu", phone: "+6289876543210", email: "siti@example.com", tags: ["vip"], whatsappOptIn: true, emailOptIn: false, totalSpend: 3400000, lastVisitAt: now() },
    { id: "cu3", name: "Walk-in Guest", phone: "", tags: [], whatsappOptIn: false, emailOptIn: false, totalSpend: 0 },
  ];

  const openSession: AppData["posSessions"][0] = {
    id: "sess-demo-open",
    outletId: IDS.outlet1,
    registerId: IDS.register1,
    openedBy: IDS.user,
    openingCash: 500000,
    status: "open",
    openedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  };

  const sampleTxn: AppData["transactions"][0] = {
    id: "txn-001",
    outletId: IDS.outlet1,
    posSessionId: openSession.id,
    customerId: "cu1",
    cashierId: IDS.user,
    receiptNumber: "KTG-001-0042",
    status: "completed",
    items: [
      {
        id: "ti1",
        productId: "p2",
        productName: "Latte",
        productVariantId: "v1",
        variantName: "Large",
        modifierIds: ["m1"],
        modifierNames: ["Oat milk"],
        recipeId: "r2",
        recipeVersion: 2,
        quantity: 2,
        unitPrice: 37000,
        discountAmount: 0,
        taxAmount: 8140,
        lineTotal: 74000,
        fifoCogs: 12000,
      },
    ],
    payments: [{ id: "pay1", method: "qris", amount: 74000 }],
    subtotal: 74000,
    discountTotal: 0,
    taxTotal: 8140,
    total: 74000,
    fifoCogsTotal: 12000,
    syncStatus: "synced",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3600000).toISOString(),
  };

  const raw: AppData = {
    company: { name: "Kentang", slug: "kentang", accentColor: "teal" },
    outlets: [
      { id: IDS.outlet1, companyId: IDS.company, brandId: IDS.brand, name: "Kentang Cafe Sudirman", code: "KTG-001", timezone: "Asia/Jakarta", address: "Jl. Sudirman No. 1", isActive: true },
      { id: IDS.outlet2, companyId: IDS.company, brandId: IDS.brand, name: "Kentang Cafe Kemang", code: "KTG-002", timezone: "Asia/Jakarta", isActive: true },
    ],
    registers: [
      { id: IDS.register1, outletId: IDS.outlet1, name: "Register 1", deviceId: "POS-001", isActive: true },
      { id: "reg-2", outletId: IDS.outlet1, name: "Register 2", isActive: true },
    ],
    categories: [
      { id: catCoffee, name: "Coffee", sortOrder: 1 },
      { id: catFood, name: "Food", sortOrder: 2 },
      { id: catRetail, name: "Retail", sortOrder: 3 },
    ],
    inventoryCategories: [],
    products,
    variants,
    modifierGroups,
    modifiers,
    inventoryItems,
    fifoLayers,
    stockLedger: [],
    recipes,
    recipeItems,
    recipeByproducts: [],
    customers,
    posSessions: [openSession],
    transactions: [sampleTxn],
    stockCounts: [],
    heldOrders: [],
    approvals: [
      {
        id: "apr1",
        outletId: IDS.outlet1,
        requestType: "void",
        sourceType: "transaction",
        sourceId: sampleTxn.id,
        status: "pending",
        reason: "Customer changed mind — wrong drink",
        createdAt: now(),
      },
      {
        id: "apr2",
        outletId: IDS.outlet1,
        requestType: "refund",
        sourceType: "transaction",
        sourceId: sampleTxn.id,
        status: "pending",
        reason: "Partial refund requested",
        createdAt: now(),
      },
      {
        id: "apr3",
        outletId: IDS.outlet1,
        requestType: "stock_adjustment",
        sourceType: "inventory",
        sourceId: "i2",
        status: "pending",
        reason: "Spilled milk during prep",
        createdAt: now(),
      },
    ],
    receiptSettings: {
      storeName: "Kentang Cafe",
      paperWidthMm: 80,
      footerText: "Terima kasih! Sampai jumpa lagi.",
      taxNumber: "01.234.567.8-901.000",
      copyCount: 1,
      autoCut: true,
    },
  };

  return resolveAppDataIds(raw);
}

function resolveAppDataIds(data: AppData): AppData {
  let json = JSON.stringify(data);
  for (const [legacy, uuid] of Object.entries(LEGACY_ID_MAP)) {
    json = json.split(`"${legacy}"`).join(`"${uuid}"`);
  }
  return JSON.parse(json) as AppData;
}
