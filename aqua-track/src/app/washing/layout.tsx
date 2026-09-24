import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { WashingNav, WashingSideNav } from "@/components/washing-nav";
import { requireRole } from "@/lib/auth/require-role";

export default async function WashingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireRole("WASHING_STAFF");

  return (
    <div className="min-h-screen">
      <RealtimeRefresh
        channelName={`washing-${profile.id}`}
        tables={[
          ...(profile.facility_id
            ? [
                {
                  table: "washing_batches",
                  filter: `facility_id=eq.${profile.facility_id}`,
                },
              ]
            : [{ table: "washing_batches" }]),
          { table: "laundry_orders" },
        ]}
      />
      <AppShell
        name={profile.full_name}
        roleLabel="Washing"
        sidebar={<WashingSideNav />}
        bottomNav={<WashingNav />}
      >
        {children}
      </AppShell>
    </div>
  );
}
