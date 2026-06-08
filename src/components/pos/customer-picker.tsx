"use client";

import { useAppData } from "@/hooks/use-app-data";
import { useCartStore } from "@/stores/cart-store";
import { CustomerSearchField } from "@/components/customers/customer-search-field";
import { Badge } from "@/components/ui/badge";

export function CustomerPicker() {
  const { data } = useAppData();
  const { customerId, setCustomer } = useCartStore();

  if (!data) return null;

  const customer = customerId ? data.customers.find((c) => c.id === customerId) : undefined;

  return (
    <div className="space-y-2 border-b px-4 py-3">
      <CustomerSearchField
        customers={data.customers}
        selectedId={customerId}
        onSelect={setCustomer}
        label="Customer"
        placeholder="Search name or mobile"
        maxResults={8}
      />
      {customer && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">Member points</Badge>
          <span className="font-medium">{customer.memberPointsBalance} pts</span>
        </div>
      )}
    </div>
  );
}
