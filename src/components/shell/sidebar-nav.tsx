"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ChefHat,
  Users,
  FileText,
  Settings,
  ClipboardCheck,
  Receipt,
  ChevronDown,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useState } from "react";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/orders", label: "Orders", icon: Receipt },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/reports", label: "Reports", icon: FileText },
];

const inventoryNav = [
  { href: "/inventory/items", label: "Items" },
  { href: "/inventory/stock-on-hand", label: "Stock on hand" },
  { href: "/inventory/ledger", label: "Ledger" },
  { href: "/inventory/receiving", label: "Receiving" },
  { href: "/inventory/transfers", label: "Transfers" },
  { href: "/inventory/wastage", label: "Wastage" },
  { href: "/inventory/counts", label: "Stock counts" },
];

const marketingNav = [
  { href: "/marketing/loyalty", label: "Loyalty Program" },
  { href: "/marketing/vouchers", label: "Vouchers" },
];

const settingsNav = [
  { href: "/settings/company", label: "Company" },
  { href: "/settings/outlets", label: "Outlets" },
  { href: "/settings/users", label: "Users" },
  { href: "/settings/receipt", label: "Receipt" },
  { href: "/settings/printer", label: "Printer" },
  { href: "/settings/integrations", label: "Integrations" },
  { href: "/settings/loyalty", label: "Loyalty" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { session } = useAuth();
  const [invOpen, setInvOpen] = useState(pathname.startsWith("/inventory"));
  const [mktOpen, setMktOpen] = useState(pathname.startsWith("/marketing"));
  const [setOpen, setSetOpen] = useState(pathname.startsWith("/settings"));

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      <div className="border-b p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Portal</p>
        <p className="font-semibold">{session?.companyName ?? "—"}</p>
      </div>
      <nav className="flex-1 overflow-auto p-2 space-y-0.5">
        {mainNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass(href)}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
        <div>
          <button
            type="button"
            onClick={() => setMktOpen(!mktOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted",
              pathname.startsWith("/marketing") && "text-foreground"
            )}
          >
            <span className="flex items-center gap-3">
              <Megaphone className="h-4 w-4" />
              Marketing
            </span>
            <ChevronDown className={cn("h-4 w-4 transition", mktOpen && "rotate-180")} />
          </button>
          {mktOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-2">
              {marketingNav.map(({ href, label }) => (
                <Link key={href} href={href} className={cn(linkClass(href), "py-1.5 text-xs")}>
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => setInvOpen(!invOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted",
              pathname.startsWith("/inventory") && "text-foreground"
            )}
          >
            <span className="flex items-center gap-3">
              <Package className="h-4 w-4" />
              Inventory
            </span>
            <ChevronDown className={cn("h-4 w-4 transition", invOpen && "rotate-180")} />
          </button>
          {invOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-2">
              {inventoryNav.map(({ href, label }) => (
                <Link key={href} href={href} className={cn(linkClass(href), "py-1.5 text-xs")}>
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => setSetOpen(!setOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted",
              pathname.startsWith("/settings") && "text-foreground"
            )}
          >
            <span className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              Settings
            </span>
            <ChevronDown className={cn("h-4 w-4 transition", setOpen && "rotate-180")} />
          </button>
          {setOpen && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-2">
              {settingsNav.map(({ href, label }) => (
                <Link key={href} href={href} className={cn(linkClass(href), "py-1.5 text-xs")}>
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
