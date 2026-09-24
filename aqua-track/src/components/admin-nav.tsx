"use client";

import {
  BarChart3,
  Building2,
  House,
  Layers,
  MessageSquareWarning,
  QrCode,
  ScrollText,
  Settings,
  Shirt,
  Users,
} from "lucide-react";
import { AppBottomNav, AppSideNav, type AppNavItem } from "@/components/app-nav";

const items: AppNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: House },
  { href: "/admin/orders", label: "Orders", icon: Shirt },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/bags", label: "Bags", icon: QrCode },
  { href: "/admin/batches", label: "Batches", icon: Layers },
  { href: "/admin/facilities", label: "Facilities", icon: Building2 },
  { href: "/admin/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit", label: "Audit", icon: ScrollText },
];

export function AdminNav() {
  return <AppBottomNav items={items} />;
}

export function AdminSideNav() {
  return <AppSideNav items={items} />;
}
