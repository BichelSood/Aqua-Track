import { EmptyState } from "@/components/empty-state";
import { PickupSessionCard } from "@/components/pickup-session-card";
import { requireRole } from "@/lib/auth/require-role";
import { getDeliveryPickups } from "@/features/delivery/get-delivery-data";
import { firstRelation } from "@/lib/relations";

export default async function DeliveryPickupsPage() {
  const profile = await requireRole("DELIVERY_BOY");
  const sessions = await getDeliveryPickups(profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Pickups</h2>
        <p className="text-sm text-muted-foreground">
          Assigned pickup sessions. Start pickup, then scan bags.
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState message="No pickup sessions are assigned to you." />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
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
          })}
        </div>
      )}
    </div>
  );
}
