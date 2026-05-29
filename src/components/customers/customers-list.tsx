"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppData } from "@/hooks/use-app-data";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { LoadingState } from "@/components/shared/LoadingState";
import { formatCurrency } from "@/lib/utils";
import type { Customer } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { matchesCustomerSearch } from "@/lib/customers/search-customers";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CustomersList() {
  const { data, loading, persist } = useAppData();
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", tags: "" },
  });

  if (loading || !data) return <LoadingState />;

  const onSubmit = async (values: FormValues) => {
    const customer: Customer = {
      id: crypto.randomUUID(),
      name: values.name,
      phone: values.phone || undefined,
      email: values.email || undefined,
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      whatsappOptIn: false,
      emailOptIn: !!values.email,
      totalSpend: 0,
    };
    await persist({ ...data, customers: [...data.customers, customer] });
    form.reset();
    setOpen(false);
    toast({ title: "Customer added", description: customer.name });
  };

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => (
        <Link href={`/customers/${r.id}`} className="font-medium hover:underline">
          {r.name}
        </Link>
      ),
    },
    { key: "phone", header: "Phone", cell: (r) => r.phone || "—" },
    { key: "tags", header: "Tags", cell: (r) => r.tags.join(", ") || "—" },
    {
      key: "spend",
      header: "Total spend",
      cell: (r) => formatCurrency(r.totalSpend),
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add customer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" placeholder="vip, regular" {...form.register("tags")} />
              </div>
              <Button type="submit" className="w-full">
                Save customer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable
        columns={columns}
        data={data.customers}
        emptyTitle="No customers"
        searchPlaceholder="Search by name or mobile number…"
        searchFilter={(r, q) => matchesCustomerSearch(r, q)}
      />
    </div>
  );
}
