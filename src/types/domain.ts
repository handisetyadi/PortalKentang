export type AppRole =
  | "cashier"
  | "barista"
  | "store_manager"
  | "inventory_staff"
  | "finance"
  | "operations_manager"
  | "commercial_analyst"
  | "company_admin";

export type InventoryItemType =
  | "raw_material"
  | "semi_finished_good"
  | "finished_good"
  | "retail_good"
  | "supply"
  | "service_non_stock";

export type StockMovementType =
  | "sale_consumption"
  | "recipe_production"
  | "byproduct_creation"
  | "purchase_receipt"
  | "transfer_out"
  | "transfer_in"
  | "wastage"
  | "stock_count_adjustment"
  | "return"
  | "manual_adjustment";

export type TransactionStatus =
  | "draft"
  | "completed"
  | "void_requested"
  | "voided"
  | "refunded"
  | "sync_pending"
  | "sync_failed";

export type SyncStatus = "online" | "offline" | "syncing" | "conflict" | "failed";

export type AccentColor = "teal" | "lime" | "electric-blue" | "bright-pink" | "bright-orange";

export interface UserSession {
  userId: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  accentColor: AccentColor;
  fullName: string;
  username: string;
  email: string | null;
  activeOutletId: string | null;
  activeBrandId: string | null;
  roles: AppRole[];
  permissions: string[];
  /** TEMPORARY: true for demo superuser Kentang — remove when Supabase auth is live */
  isDemoSuperuser?: boolean;
}

export interface CartLine {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  modifierIds: string[];
  modifierNames: string[];
  quantity: number;
  unitPrice: number;
  /** Sum of modifier price deltas for this line */
  modifierPriceTotal: number;
  discountAmount: number;
  taxRate: number;
  notes?: string;
  recipeId?: string;
  recipeVersion?: number;
}

export interface PaymentLine {
  method: string;
  amount: number;
  reference?: string;
}

export interface OfflineTransaction {
  localId: string;
  outletId: string;
  sessionId?: string;
  customerId?: string;
  lines: CartLine[];
  payments: PaymentLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  cartNote?: string;
  createdAt: string;
  syncStatus: "pending" | "synced" | "failed" | "conflict";
  syncError?: string;
  serverId?: string;
  receiptNumber?: string;
}

export const PERMISSION_KEYS = [
  "pos.session.open",
  "pos.session.close",
  "pos.transaction.create",
  "pos.transaction.void.request",
  "pos.transaction.void.approve",
  "pos.receipt.print",
  "pos.receipt.reprint",
  "pos.invoice.email",
  "pos.invoice.whatsapp",
  "inventory.item.read",
  "inventory.item.manage",
  "inventory.stock.adjust",
  "inventory.stock.count",
  "inventory.stock.transfer",
  "inventory.wastage.create",
  "recipe.read",
  "recipe.manage",
  "recipe.cost.view",
  "customer.read",
  "customer.manage",
  "dashboard.outlet.view",
  "dashboard.company.view",
  "finance.view",
  "finance.export",
  "settings.company.manage",
  "settings.user.manage",
  "settings.role.manage",
  "settings.integration.manage",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const ROLE_DEFAULT_ROUTES: Record<AppRole, string> = {
  cashier: "/pos",
  barista: "/pos",
  store_manager: "/dashboard",
  inventory_staff: "/inventory/items",
  finance: "/reports",
  operations_manager: "/dashboard",
  commercial_analyst: "/dashboard",
  company_admin: "/dashboard",
};
