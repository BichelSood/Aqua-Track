"use client";

import { House, Package, QrCode, Truck, UserRound } from "lucide-react";
import { AppBottomNav, AppSideNav, type AppNavItem } from "@/components/app-nav";

const items: AppNavItem[] = [
  { href: "/delivery/dashboard", label: "Dashboard", icon: House },
  { href: "/delivery/pickups", label: "Pickups", icon: Package },
  { href: "/delivery/deliveries", label: "Deliveries", icon: Truck },
  { href: "/delivery/scan", label: "Scan", icon: QrCode },
  { href: "/delivery/profile", label: "Profile", icon: UserRound },
];

export function DeliveryNav() {
  return <AppBottomNav items={items} />;
}

export function DeliverySideNav() {
  return <AppSideNav items={items} />;
}
