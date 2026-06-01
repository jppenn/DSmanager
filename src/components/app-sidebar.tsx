"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Users,
  Building2,
  BarChart3,
  Settings,
  Package,
} from "lucide-react";
import type { UserRole } from "@/lib/types/database";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Customer Orders", icon: ShoppingCart },
  { href: "/purchase-orders", label: "Vendor POs", icon: Truck },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/vendors", label: "Vendors", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const adminNav = [
  { href: "/settings/users", label: "Users", icon: Settings },
];

export function AppSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const items = role === "admin" ? [...nav, ...adminNav] : nav;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Package className="size-4" />
        </div>
        <span className="text-sm font-semibold">Dropship Manager</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
