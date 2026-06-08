import type {
  AppRole,
  InventoryItemType,
  StockMovementType,
  TransactionStatus,
} from "@/types/domain";

export interface Outlet {
  id: string;
  companyId: string;
  brandId: string;
  name: string;
  code: string;
  timezone: string;
  address?: string;
  isActive: boolean;
}

export interface Register {
  id: string;
  outletId: string;
  name: string;
  deviceId?: string;
  isActive: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface InventoryCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  inventoryItemId?: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: number;
  taxRate: number;
  isRecipeBased: boolean;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  priceDelta: number;
  isActive: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  productIds: string[];
}

export interface Modifier {
  id: string;
  groupId: string;
  name: string;
  priceDelta: number;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  categoryId?: string;
  type: InventoryItemType;
  sku: string;
  barcode?: string;
  name: string;
  baseUnit: string;
  trackStock: boolean;
  trackExpiry: boolean;
  fifoCosting: boolean;
  reorderPoint?: number;
  isActive: boolean;
}

export interface FifoCostLayer {
  id: string;
  outletId: string;
  warehouseId: string;
  inventoryItemId: string;
  batchCode?: string;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number;
  receivedAt: string;
  expiresAt?: string;
}

export interface StockLedgerEntry {
  id: string;
  outletId: string;
  warehouseId: string;
  inventoryItemId: string;
  movementType: StockMovementType;
  quantityDelta: number;
  unit: string;
  unitCost?: number;
  totalCost?: number;
  fifoCostLayerId?: string;
  batchCode?: string;
  expiresAt?: string;
  sourceType: string;
  sourceId: string;
  notes?: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  productId?: string;
  productVariantId?: string;
  name: string;
  version: number;
  outputQuantity: number;
  outputUnit: string;
  yieldFactor: number;
  isActive: boolean;
}

export interface RecipeItem {
  id: string;
  recipeId: string;
  inventoryItemId: string;
  /** Semi-finished good used before raw material when substitute is enabled and stock exists. */
  substituteInventoryItemId?: string;
  substituteQuantity?: number;
  substituteUnit?: string;
  modifierId?: string;
  quantity: number;
  unit: string;
  conversionToBaseFactor: number;
  isOptional: boolean;
}

export interface RecipeByproduct {
  id: string;
  recipeId: string;
  /** Consumed first in production when stock is available. */
  semiFinishedInventoryItemId?: string;
  /** Used when semi-finished stock is insufficient. */
  rawMaterialInventoryItemId?: string;
  quantity: number;
  unit: string;
  expiryDays: number;
  costAllocationPercent: number;
}

export type LoyaltyRedeemType = "beverage" | "food" | "retail" | "specific_product";

export type VoucherDiscountType = "percentage" | "fixed_amount";

export type LoyaltyPointLedgerType = "earn" | "redeem";

export interface LoyaltySettings {
  rupiahPerPoint: number;
}

export interface LoyaltyRedemptionRule {
  id: string;
  pointsRequired: number;
  redeemType: LoyaltyRedeemType;
  productId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Voucher {
  id: string;
  code: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minSpend: number;
  validFrom: string;
  validUntil: string;
  maxRedemptions?: number;
  redemptionCount: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoucherRedemption {
  id: string;
  voucherId: string;
  transactionId: string;
  customerId?: string;
  discountApplied: number;
  redeemedAt: string;
}

export interface LoyaltyPointLedgerEntry {
  id: string;
  customerId: string;
  transactionId?: string;
  type: LoyaltyPointLedgerType;
  pointsDelta: number;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Customer {
  id: string;
  brandId?: string;
  name: string;
  phone?: string;
  email?: string;
  birthday?: string;
  tags: string[];
  whatsappOptIn: boolean;
  emailOptIn: boolean;
  notes?: string;
  memberPointsBalance: number;
  totalSpend: number;
  lastTransactionAt?: string;
  /** @deprecated use lastTransactionAt */
  lastVisitAt?: string;
}

export interface PosSession {
  id: string;
  outletId: string;
  registerId?: string;
  openedBy: string;
  closedBy?: string;
  deviceId?: string;
  openingCash: number;
  closingCash?: number;
  status: "open" | "closed";
  openedAt: string;
  closedAt?: string;
  notes?: string;
}

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  productVariantId?: string;
  variantName?: string;
  modifierIds: string[];
  modifierNames: string[];
  recipeId?: string;
  recipeVersion?: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  fifoCogs: number;
  notes?: string;
}

export interface Payment {
  id: string;
  method: string;
  amount: number;
  reference?: string;
}

export interface Transaction {
  id: string;
  localId?: string;
  outletId: string;
  posSessionId?: string;
  customerId?: string;
  cashierId: string;
  receiptNumber: string;
  status: TransactionStatus;
  items: TransactionItem[];
  payments: Payment[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  fifoCogsTotal: number;
  voucherId?: string;
  voucherCode?: string;
  voucherDiscount: number;
  pointsRedeemed: number;
  pointsEarned: number;
  loyaltyRuleId?: string;
  redeemedProductId?: string;
  redeemedLineDiscount: number;
  syncStatus: "synced" | "pending" | "failed" | "conflict";
  syncMetadata?: Record<string, unknown>;
  invoicePdfPath?: string;
  cartNote?: string;
  createdAt: string;
  completedAt?: string;
}

export interface StockCount {
  id: string;
  outletId: string;
  warehouseId: string;
  posSessionId?: string;
  status: "draft" | "submitted" | "applied";
  items: StockCountItem[];
  createdAt: string;
  submittedAt?: string;
}

export interface StockCountItem {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  expectedQuantity: number;
  countedQuantity: number;
  reason?: string;
}

export interface HeldOrder {
  id: string;
  outletId: string;
  label?: string;
  payload: unknown;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  outletId?: string;
  requestType: string;
  sourceType: string;
  sourceId: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason?: string;
  createdAt: string;
}

export interface ReceiptSettings {
  storeName: string;
  logoUrl?: string;
  paperWidthMm: 58 | 80;
  footerText: string;
  taxNumber: string;
  copyCount: number;
  autoCut: boolean;
}

export interface CompanySettings {
  name: string;
  slug: string;
  accentColor: string;
}

export interface AppData {
  company: CompanySettings;
  outlets: Outlet[];
  registers: Register[];
  categories: ProductCategory[];
  inventoryCategories: InventoryCategory[];
  products: Product[];
  variants: ProductVariant[];
  modifierGroups: ModifierGroup[];
  modifiers: Modifier[];
  inventoryItems: InventoryItem[];
  fifoLayers: FifoCostLayer[];
  stockLedger: StockLedgerEntry[];
  recipes: Recipe[];
  recipeItems: RecipeItem[];
  recipeByproducts: RecipeByproduct[];
  customers: Customer[];
  posSessions: PosSession[];
  transactions: Transaction[];
  stockCounts: StockCount[];
  heldOrders: HeldOrder[];
  approvals: ApprovalRequest[];
  receiptSettings: ReceiptSettings;
  loyaltySettings: LoyaltySettings;
  loyaltyRules: LoyaltyRedemptionRule[];
  vouchers: Voucher[];
  voucherRedemptions: VoucherRedemption[];
  loyaltyPointLedger: LoyaltyPointLedgerEntry[];
}
