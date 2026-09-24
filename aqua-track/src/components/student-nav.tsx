"use client";

import { Bell, Clock3, House, MessageSquareWarning, Shirt, UserRound } from "lucide-react";
import { AppBottomNav, AppSideNav, type AppNavItem } from "@/components/app-nav";

function items(unreadCount: number): AppNavItem[] {
  return [
    { href: "/dashboard", label: "Home", icon: House },
    { href: "/laundry", label: "Laundry", icon: Shirt },
    { href: "/notifications", label: "Alerts", icon: Bell, badge: unreadCount },
    { href: "/history", label: "History", icon: Clock3 },
    { href: "/profile", label: "Profile", icon: UserRound },
  ];
}

export function StudentNav({ unreadCount = 0 }: { unreadCount?: number }) {
  return <AppBottomNav items={items(unreadCount)} />;
}

export function StudentSideNav({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <AppSideNav
      items={[
        ...items(unreadCount),
        { href: "/complaints", label: "Complaints", icon: MessageSquareWarning },
      ]}
    />
  );
}
