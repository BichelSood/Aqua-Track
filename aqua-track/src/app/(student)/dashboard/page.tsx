import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { PickupAnnouncement } from "@/components/pickup-announcement";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getStudentDashboardData } from "@/features/student/get-dashboard-data";
import { getLaundryStatusLabel } from "@/lib/labels";
import { firstRelation } from "@/lib/relations";
import { PageIntro } from "@/components/page-intro";

function nextAction({
  pickupSession,
  activeCount,
  unreadCount,
  latestStatus,
}: {
  pickupSession: { status: string } | null;
  activeCount: number;
  unreadCount: number;
  latestStatus: string | null;
}) {
  if (pickupSession && activeCount === 0) {
    return "Pickup is available. Bring your bag to reception when staff arrive.";
  }

  if (latestStatus === "OUT_FOR_DELIVERY") {
    return "Your laundry is out for delivery. Please be available to receive it.";
  }

  if (latestStatus === "DELIVERY_ATTEMPTED") {
    return "Delivery was attempted. Staff will try again.";
  }

  if (unreadCount > 0) {
    return `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`;
  }

  if (activeCount > 0 && latestStatus) {
    return `Your laundry is currently ${getLaundryStatusLabel(latestStatus).toLowerCase()}. Nothing else is required right now.`;
  }

  return "Nothing needed from you right now.";
}

export default async function StudentDashboardPage() {
  const profile = await requireRole("STUDENT");
  const { pickupSession, hostelName, laundryOrders, unreadCount } =
    await getStudentDashboardData(profile.id);

  const latest = laundryOrders[0] ?? null;

  return (
    <div className="space-y-6">
      <PageIntro
        title="Home"
        description="Pickup, laundry status, and anything you need to do."
      />

      <Card>
        <CardHeader>
          <CardTitle>Do I need to do anything?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {nextAction({
              pickupSession,
              activeCount: laundryOrders.length,
              unreadCount,
              latestStatus: latest?.status ?? null,
            })}
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Is pickup available?</CardTitle>
          </CardHeader>
          <CardContent>
            {pickupSession ? (
              <div className="space-y-2">
                {hostelName ? (
                  <p className="text-sm font-medium">{hostelName}</p>
                ) : null}
                <PickupAnnouncement
                  scheduledDate={pickupSession.scheduled_date}
                  startTime={pickupSession.start_time}
                  endTime={pickupSession.end_time}
                  status={pickupSession.status}
                />
              </div>
            ) : (
              <EmptyState message="No pickup is announced for your hostel right now." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where is my laundry?</CardTitle>
          </CardHeader>
          <CardContent>
            {latest ? (
              <OrderCard
                orderNumber={latest.order_number}
                status={latest.status}
                bagCode={firstRelation(latest.bags)?.bag_code}
                href={`/laundry/${latest.id}`}
              />
            ) : (
              <EmptyState message="You do not have active laundry." />
            )}
            <p className="mt-4 text-sm">
              <Link href="/laundry" className="underline">
                View all laundry
              </Link>
              {" · "}
              <Link href="/complaints" className="underline">
                Report a problem
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
