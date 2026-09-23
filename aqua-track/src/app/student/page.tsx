import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireRole } from "@/lib/auth/require-role";
import { getStudentDashboardData } from "@/lib/dashboard/student";

const statusLabels: Record<string, string> = {
  COLLECTED: "Collected",
  RECEIVED_AT_FACILITY: "Received at Facility",
  UNDER_WASHING: "Under Washing",
  READY_FOR_DELIVERY: "Ready for Delivery",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERY_ATTEMPTED: "Delivery Attempted",
  DELIVERED: "Delivered",
};

export default async function StudentPage() {
  const profile = await requireRole("STUDENT");

  const {
    pickupSession,
    laundryOrders,
    statusHistory,
  } = await getStudentDashboardData(profile.id);

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <header>
          <p className="text-sm text-muted-foreground">
            Aqua Track
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Student Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Welcome, {profile.full_name}
          </p>
        </header>

        <Separator />

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pickup</CardTitle>
            </CardHeader>

            <CardContent>
              {pickupSession ? (
                <div className="space-y-2">
                  <p className="font-medium">
                    {pickupSession.scheduled_date}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {pickupSession.start_time}–
                    {pickupSession.end_time}
                  </p>

                  <Badge>{pickupSession.status}</Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No upcoming pickup session.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Laundry</CardTitle>
            </CardHeader>

            <CardContent>
              {laundryOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No laundry orders yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {laundryOrders.map((order) => {
                    const bag = Array.isArray(order.bags)
                      ? order.bags[0]
                      : order.bags;

                    const orderHistory = statusHistory.filter(
                      (entry) =>
                        entry.laundry_order_id === order.id,
                    );

                    return (
                      <div
                        key={order.id}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">
                              {order.order_number}
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              Bag: {bag?.bag_code ?? "Unknown bag"}
                            </p>
                          </div>

                          <Badge>
                            {statusLabels[order.status] ??
                              order.status}
                          </Badge>
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">
                          Created{" "}
                          {new Date(
                            order.created_at,
                          ).toLocaleString()}
                        </p>

                        {orderHistory.length > 0 ? (
                          <>
                            <Separator className="my-4" />

                            <div>
                              <h3 className="mb-4 text-sm font-semibold">
                                Order Timeline
                              </h3>

                              <div className="space-y-4">
                                {orderHistory.map(
                                  (entry, index) => (
                                    <div
                                      key={entry.id}
                                      className="flex gap-3"
                                    >
                                      <div className="flex flex-col items-center">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-background text-xs font-semibold">
                                          {index + 1}
                                        </div>

                                        {index <
                                        orderHistory.length - 1 ? (
                                          <div className="mt-1 h-full min-h-5 w-px bg-border" />
                                        ) : null}
                                      </div>

                                      <div className="pb-2">
                                        <p className="font-medium">
                                          {statusLabels[
                                            entry.to_status
                                          ] ??
                                            entry.to_status}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                          {new Date(
                                            entry.created_at,
                                          ).toLocaleString()}
                                        </p>

                                        {entry.reason ? (
                                          <p className="mt-1 text-xs text-muted-foreground">
                                            {entry.reason}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}