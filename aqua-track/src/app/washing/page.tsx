import { Badge } from "@/components/ui/badge";
import { TransitionButton } from "./transition-button";
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

export default async function WashingPage() {
  const profile = await requireRole("WASHING_STAFF");
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("laundry_orders")
    .select(
      `
        id,
        order_number,
        status,
        created_at,
        submitted_at,
        bags (
          bag_code
        ),
        profiles!laundry_orders_student_id_fkey (
          full_name
        )
      `,
    )
    .in("status", [
      "COLLECTED",
      "RECEIVED_AT_FACILITY",
      "UNDER_WASHING",
    ])
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load laundry orders.");
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <header>
          <p className="text-sm text-muted-foreground">Aqua Track</p>

          <h1 className="text-3xl font-bold tracking-tight">
            Washing Operations
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Welcome, {profile.full_name}
          </p>
        </header>

        <Separator />

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Laundry Queue</h2>

            <p className="text-sm text-muted-foreground">
              Orders currently being processed by the washing facility.
            </p>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground">
                  No laundry orders are currently waiting for processing.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const bag = Array.isArray(order.bags)
                  ? order.bags[0]
                  : order.bags;

                const student = Array.isArray(order.profiles)
                  ? order.profiles[0]
                  : order.profiles;

                return (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle>{order.order_number}</CardTitle>

                          <CardDescription>
                            {student?.full_name ?? "Unknown student"}
                          </CardDescription>
                        </div>

                        <Badge>{order.status}</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-muted-foreground">Bag</p>
                          <p className="font-medium">
                            {bag?.bag_code ?? "Unknown bag"}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <Separator />

                     <div className="space-y-4">
  <div>
    <p className="text-sm text-muted-foreground">
      Current status
    </p>

    <p className="mt-1 font-medium">{order.status}</p>
  </div>

  {order.status === "COLLECTED" ? (
   <TransitionButton
  orderId={order.id}
  toStatus="RECEIVED_AT_FACILITY"
  label="Receive at Facility"
/>
  ) : null}

  {order.status === "RECEIVED_AT_FACILITY" ? (
   <TransitionButton
  orderId={order.id}
  toStatus="UNDER_WASHING"
  label="Start Washing"
/>
  ) : null}

  {order.status === "UNDER_WASHING" ? (
   <TransitionButton
  orderId={order.id}
  toStatus="READY_FOR_DELIVERY"
  label="Mark Ready for Delivery"
/>
  ) : null}
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