import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionProgress } from "@/components/collection-progress";
import { PickupSessionCard } from "@/components/pickup-session-card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { getDeliveryPickupDetail } from "@/features/delivery/get-delivery-data";
import { firstRelation } from "@/lib/relations";
import { PickupSessionButton } from "../../pickup-session-button";
import { UniversalScanner } from "../../scan/universal-scanner";

export default async function DeliveryPickupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("DELIVERY_BOY");
  const { id } = await params;
  const detail = await getDeliveryPickupDetail(profile.id, id);

  if (!detail) {
    notFound();
  }

  const { session, orders } = detail;
  const hostel = firstRelation(session.hostels);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/delivery/pickups" className="underline">
          Pickups
        </Link>
      </p>

      <PickupSessionCard
        id={session.id}
        hostelName={hostel?.name ?? "Unknown hostel"}
        hostelCode={hostel?.code}
        scheduledDate={session.scheduled_date}
        startTime={session.start_time}
        endTime={session.end_time}
        status={session.status}
      >
        <div className="flex flex-wrap gap-3">
          {session.status === "ANNOUNCED" ? (
            <PickupSessionButton pickupSessionId={session.id} action="START" />
          ) : null}
          {session.status === "ACTIVE" ? (
            <PickupSessionButton
              pickupSessionId={session.id}
              action="COMPLETE"
            />
          ) : null}
        </div>
      </PickupSessionCard>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Collection progress</h3>
        <CollectionProgress
          orders={orders.map((order) => ({
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            created_at: order.created_at,
            bagCode: firstRelation(order.bags)?.bag_code,
            studentName: firstRelation(order.profiles)?.full_name,
          }))}
        />
      </section>

      {session.status === "ACTIVE" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Collect bags</h3>
            <Button asChild variant="outline">
              <Link href="/delivery/scan">Full scanner</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Scan the bag QR or enter a roll number. The server chooses the
            operation.
          </p>
          <UniversalScanner />
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          Start pickup before collecting bags.
        </p>
      )}
    </div>
  );
}
