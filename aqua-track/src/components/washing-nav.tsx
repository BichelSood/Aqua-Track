"use client";

import { House, Layers, ListTodo, QrCode, UserRound } from "lucide-react";
import { AppBottomNav, AppSideNav, type AppNavItem } from "@/components/app-nav";

const items: AppNavItem[] = [
  { href: "/washing/dashboard", label: "Dashboard", icon: House },
  { href: "/washing/batches", label: "Batches", icon: Layers },
  { href: "/washing/queue", label: "Queue", icon: ListTodo },
  { href: "/washing/scan", label: "Scan", icon: QrCode },
  { href: "/washing/profile", label: "Profile", icon: UserRound },
];

export function WashingNav() {
  return <AppBottomNav items={items} />;
}

export function WashingSideNav() {
  return <AppSideNav items={items} />;
}
