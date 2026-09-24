"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

function itemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppBottomNav({ items }: { items: AppNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="glass-panel fixed inset-x-3 bottom-3 z-40 overflow-x-auto rounded-[1.25rem] md:hidden">
      <ul
        className={items.length > 6 ? "flex min-w-max" : "grid"}
        style={
          items.length > 6
            ? undefined
            : {
                gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
              }
        }
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = itemActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] transition-colors duration-200",
                  items.length > 6 && "w-[4.5rem]",
                  active ? "text-highlight" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "relative rounded-xl p-1.5 transition-all duration-200",
                    active && "bg-accent/15 aqua-glow",
                  )}
                >
                  <Icon className="size-5" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] leading-4 text-white">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppSideNav({
  items,
  brand = "Aqua Track",
}: {
  items: AppNavItem[];
  brand?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function toggle() {
    setCollapsed((current) => !current);
  }

  return (
    <aside
      className={cn(
        "glass-panel sticky top-4 hidden h-[calc(100vh-2rem)] shrink-0 flex-col rounded-[1.25rem] transition-[width] duration-300 md:flex",
        collapsed ? "w-[4.5rem]" : "w-60",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-4">
        {!collapsed ? (
          <p className="px-1 text-xs font-semibold tracking-[0.22em] text-highlight uppercase">
            {brand}
          </p>
        ) : (
          <span className="mx-auto size-2 rounded-full bg-accent shadow-[0_0_12px_var(--aqua)]" />
        )}
        <button
          type="button"
          onClick={toggle}
          className="rounded-xl p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-accent/10 hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = itemActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-accent/15 font-medium text-foreground aqua-glow"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed ? (
                  <span className="flex-1 truncate">{item.label}</span>
                ) : null}
                {!collapsed && item.badge && item.badge > 0 ? (
                  <span className="rounded-full bg-destructive px-1.5 text-[10px] leading-4 text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
