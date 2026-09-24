import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { AdminNav, AdminSideNav } from "@/components/admin-nav";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireRole("ADMIN");

  return (
    <div className="min-h-screen">
      <RealtimeRefresh
        channelName={`admin-${profile.id}`}
        tables={[
          { table: "laundry_orders" },
          { table: "pickup_sessions" },
          { table: "delivery_batches" },
          { table: "washing_batches" },
          { table: "complaints" },
          { table: "notifications" },
        ]}
      />
      <AppShell
        name={profile.full_name}
        roleLabel="Admin"
        wide
        sidebar={<AdminSideNav />}
        bottomNav={<AdminNav />}
      >
        {children}
      </AppShell>
    </div>
  );
}
