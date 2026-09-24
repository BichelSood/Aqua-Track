import Link from "next/link";
import { Package, QrCode, Truck } from "lucide-react";
import { PickupSessionCard } from "@/components/pickup-session-card";
import { PageIntro } from "@/components/page-intro";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getDeliveryDashboardData } from "@/features/delivery/get-delivery-data";
import { firstRelation } from "@/lib/relations";
import { getDeliveryBatchStatusLabel } from "@/lib/labels";

export default async function DeliveryDashboardPage() {
  const profile = await requireRole("DELIVERY_BOY");
  const {
    pickupSessions,
    deliveryBatches,
    activePickup,
    collectedCount,
    openBatchCount,
    outForDeliveryCount,
  } = await getDeliveryDashboardData(profile.id);

  return (
    <div className="space-y-6">
      <PageIntro
        title="Dashboard"
        description="Pickup, collection, and hostel delivery."
        action={
          <Button asChild>
            <Link href="/delivery/scan">Open scanner</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Active pickup"
          value={activePickup ? "Yes" : "No"}
          icon={Package}
          description={
            activePickup
              ? `${collectedCount} bag${collectedCount === 1 ? "" : "s"} collected`
              : "Start an announced pickup to collect bags"
          }
        />
        <StatCard
          title="Open delivery batches"
          value={openBatchCount}
          icon={Truck}
        />
        <StatCard
          title="Out for delivery"
          value={outForDeliveryCount}
          icon={QrCode}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Pickups</h3>
        {pickupSessions.length === 0 ? (
          <EmptyState message="No announced or active pickup sessions." />
        ) : (
          pickupSessions.map((session) => {
            const hostel = firstRelation(session.hostels);
            return (
              <PickupSessionCard
                key={session.id}
                id={session.id}
                hostelName={hostel?.name ?? "Unknown hostel"}
                hostelCode={hostel?.code}
                scheduledDate={session.scheduled_date}
                startTime={session.start_time}
                endTime={session.end_time}
                status={session.status}
                href={`/delivery/pickups/${session.id}`}
              />
            );
          })
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Delivery batches</h3>
        {deliveryBatches.length === 0 ? (
          <EmptyState message="No open delivery batches." />
        ) : (
          deliveryBatches.map((batch) => {
            const hostel = firstRelation(batch.hostels);
            return (
              <Card key={batch.id}>
                <CardHeader>
                  <CardTitle>{batch.batch_number}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {hostel?.name ?? "Unknown hostel"} ·{" "}
                  {getDeliveryBatchStatusLabel(batch.status)}
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
