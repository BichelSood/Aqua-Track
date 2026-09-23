import { Badge } from "@/components/ui/badge";
import { DeliveryTransitionButton } from "./delivery-transition-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export default async function DeliveryPage() {
  const profile = await requireRole("DELIVERY_BOY");
  const supabase = await createClient();

  const { data: pickupSessions, error: pickupError } = await supabase
    .from("pickup_sessions")
    .select(
      "id, scheduled_date, start_time, end_time, status, hostel_id, hostels(name, code)",
    )
    .eq("delivery_boy_id", profile.id)
    .in("status", ["ANNOUNCED", "ACTIVE"])
    .order("scheduled_date", { ascending: true })
    .limit(10);

  if (pickupError) {
    throw new Error("Unable to load pickup sessions.");
  }

  const pickupSessionIds = pickupSessions.map((session) => session.id);

  let orders: Array<{
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    pickup_session_id: string;
    bags:
      | {
          bag_code: string;
        }
      | {
          bag_code: string;
        }[]
      | null;
    profiles:
      | {
          full_name: string;
        }
      | {
          full_name: string;
        }[]
      | null;
  }> = [];

  if (pickupSessionIds.length > 0) {
    const { data: orderData, error: orderError } = await supabase
      .from("laundry_orders")
      .select(
        `
          id,
          order_number,
          status,
          created_at,
          pickup_session_id,
          bags (
            bag_code
          ),
          profiles!laundry_orders_student_id_fkey (
            full_name
          )
        `,
      )
      .in("pickup_session_id", pickupSessionIds)
      .in("status", [
        "READY_FOR_DELIVERY",
        "OUT_FOR_DELIVERY",
        "DELIVERY_ATTEMPTED",
      ])
      .order("created_at", { ascending: true });

    if (orderError) {
      throw new Error("Unable to load delivery orders.");
    }

    orders = orderData ?? [];
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <header>
          <p className="text-sm text-muted-foreground">Aqua Track</p>

          <h1 className="text-3xl font-bold tracking-tight">
            Delivery Operations
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Welcome, {profile.full_name}
          </p>
        </header>

        <Separator />

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Pickup Sessions</h2>

            <p className="text-sm text-muted-foreground">
              Your currently assigned pickup sessions.
            </p>
          </div>

          {pickupSessions.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground">
                  No active pickup sessions assigned to you.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pickupSessions.map((session) => {
                const hostel = Array.isArray(session.hostels)
                  ? session.hostels[0]
                  : session.hostels;

                const sessionOrders = orders.filter(
                  (order) => order.pickup_session_id === session.id,
                );

                return (
                  <Card key={session.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle>
                            {hostel?.name ?? "Unknown Hostel"}
                          </CardTitle>

                          <CardDescription>
                            {hostel?.code ?? "No hostel code"}
                          </CardDescription>
                        </div>

                        <Badge>{session.status}</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <p className="text-sm">
                        {session.scheduled_date} · {session.start_time}–
                        {session.end_time}
                      </p>

                      <Separator />

                      <div>
                        <h3 className="mb-3 text-base font-semibold">
                          Laundry for Delivery
                        </h3>

                        {sessionOrders.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No laundry is currently ready for delivery.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {sessionOrders.map((order) => {
                              const bag = Array.isArray(order.bags)
                                ? order.bags[0]
                                : order.bags;

                              const student = Array.isArray(order.profiles)
                                ? order.profiles[0]
                                : order.profiles;

                              return (
                                <div
                                  key={order.id}
                                  className="rounded-lg border p-4"
                                >
                                <div>
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="font-semibold">
        {order.order_number}
      </p>

      <p className="text-sm text-muted-foreground">
        {student?.full_name ?? "Unknown student"}
      </p>

      <p className="mt-1 text-sm text-muted-foreground">
        Bag: {bag?.bag_code ?? "Unknown bag"}
      </p>
    </div>

    <Badge>{order.status}</Badge>
  </div>

  {order.status === "READY_FOR_DELIVERY" ? (
    <DeliveryTransitionButton
      orderId={order.id}
      toStatus="OUT_FOR_DELIVERY"
      label="Take Out for Delivery"
    />
  ) : null}

  {order.status === "OUT_FOR_DELIVERY" ? (
    <div className="mt-4 flex flex-wrap gap-3">
      <DeliveryTransitionButton
        orderId={order.id}
        toStatus="DELIVERED"
        label="Mark Delivered"
      />

      <DeliveryTransitionButton
        orderId={order.id}
        toStatus="DELIVERY_ATTEMPTED"
        label="Delivery Attempted"
      />
    </div>
  ) : null}

  {order.status === "DELIVERY_ATTEMPTED" ? (
    <DeliveryTransitionButton
      orderId={order.id}
      toStatus="OUT_FOR_DELIVERY"
      label="Retry Delivery"
    />
  ) : null}
</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}