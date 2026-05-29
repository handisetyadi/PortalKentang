"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { filterCustomers } from "@/lib/customers/search-customers";
import type { Customer } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const WALK_IN_LABEL = "Walk-in (no customer)";

interface CustomerSearchFieldProps {
  customers: Customer[];
  selectedId?: string;
  onSelect: (customerId: string | undefined) => void;
  label?: string;
  placeholder?: string;
  maxResults?: number;
  className?: string;
}

export function CustomerSearchField({
  customers,
  selectedId,
  onSelect,
  label = "Customer",
  placeholder = "Search name or mobile",
  maxResults = 12,
  className,
}: CustomerSearchFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = customers.find((c) => c.id === selectedId);

  const results = useMemo(() => {
    const filtered = filterCustomers(customers, query).slice(0, maxResults);
    const q = query.trim().toLowerCase();
    const showWalkIn =
      !q || WALK_IN_LABEL.toLowerCase().includes(q) || "walk-in".includes(q);
    return { filtered, showWalkIn };
  }, [customers, query, maxResults]);

  const closedDisplay = selected
    ? selected.phone
      ? `${selected.name} · ${selected.phone}`
      : selected.name
    : WALK_IN_LABEL;

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    close();
  };

  const pickWalkIn = () => {
    onSelect(undefined);
    close();
  };

  const pickCustomer = (id: string) => {
    onSelect(id);
    close();
  };

  return (
    <div className={cn("space-y-1.5", className)} ref={containerRef}>
      {label ? <Label className="text-xs text-muted-foreground">{label}</Label> : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className={cn(
            "h-9 cursor-pointer pr-9 pl-9",
            open && "cursor-text"
          )}
          value={open ? query : closedDisplay}
          placeholder={open ? placeholder : undefined}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          aria-label={label || "Customer"}
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
          autoComplete="off"
        />
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </div>

      {open && (
        <ul
          className="max-h-40 space-y-0.5 overflow-y-auto rounded-md border bg-popover p-1 text-sm shadow-md"
          role="listbox"
        >
          {results.showWalkIn && (
            <li role="option" aria-selected={!selectedId}>
              <button
                type="button"
                className={cn(
                  "flex w-full rounded-sm px-2 py-2 text-left hover:bg-accent",
                  !selectedId && "bg-accent font-medium"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={pickWalkIn}
              >
                <span className="text-muted-foreground">{WALK_IN_LABEL}</span>
              </button>
            </li>
          )}
          {results.filtered.map((c) => (
            <li key={c.id} role="option" aria-selected={c.id === selectedId}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col rounded-sm px-2 py-2 text-left hover:bg-accent",
                  c.id === selectedId && "bg-accent"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickCustomer(c.id)}
              >
                <span className="font-medium">{c.name}</span>
                {c.phone ? (
                  <span className="text-xs text-muted-foreground">{c.phone}</span>
                ) : null}
              </button>
            </li>
          ))}
          {query.trim() && results.filtered.length === 0 && !results.showWalkIn && (
            <li className="px-2 py-3 text-center text-xs text-muted-foreground">
              No customers match &ldquo;{query.trim()}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
