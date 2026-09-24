import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { DeliveryNav, DeliverySideNav } from "@/components/delivery-nav";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { requireRole } from "@/lib/auth/require-role";

export default async function DeliveryLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireRole("DELIVERY_BOY");

  return (
    <div className="min-h-screen">
      <RealtimeRefresh
        channelName={`delivery-${profile.id}`}
        tables={[
          { table: "pickup_sessions", filter: `delivery_boy_id=eq.${profile.id}` },
          {
            table: "delivery_batches",
            filter: `delivery_boy_id=eq.${profile.id}`,
          },
          { table: "laundry_orders" },
          { table: "washing_batches" },
        ]}
      />
      <AppShell
        name={profile.full_name}
        roleLabel="Delivery"
        sidebar={<DeliverySideNav />}
        bottomNav={<DeliveryNav />}
      >
        {children}
      </AppShell>
    </div>
  );
}
