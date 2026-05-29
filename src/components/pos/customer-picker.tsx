"use client";

import { useAppData } from "@/hooks/use-app-data";
import { useCartStore } from "@/stores/cart-store";
import { CustomerSearchField } from "@/components/customers/customer-search-field";

export function CustomerPicker() {
  const { data } = useAppData();
  const { customerId, setCustomer } = useCartStore();

  if (!data) return null;

  return (
    <div className="border-b px-4 py-3">
      <CustomerSearchField
        customers={data.customers}
        selectedId={customerId}
        onSelect={setCustomer}
        label="Customer"
        placeholder="Search name or mobile"
        maxResults={8}
      />
    </div>
  );
}
