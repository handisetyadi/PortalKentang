"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/marketing/loyalty", label: "Loyalty Program" },
  { href: "/marketing/vouchers", label: "Vouchers" },
];

export function MarketingSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-2 border-b pb-2">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            pathname === href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
