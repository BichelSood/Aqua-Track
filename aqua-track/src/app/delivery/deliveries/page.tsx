import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getDeliveryBatchesPage } from "@/features/delivery/get-delivery-data";
import { firstRelation } from "@/lib/relations";
import { getDeliveryBatchStatusLabel } from "@/lib/labels";
import {
  CreateDeliveryBatchButton,
  DeliveryBatchLifecycleButton,
} from "../batch-buttons";
import { RetryDeliveryButton } from "../retry-button";

export default async function DeliveryDeliveriesPage() {
  const profile = await requireRole("DELIVERY_BOY");
  const { deliveryBatches, orders } = await getDeliveryBatchesPage(profile.id);

  const readyByHostel: Map<
    string,
    { hostelName: string; orderIds: string[] }
  > = new Map();

  for (const order of orders) {
    if (order.status !== "READY_FOR_DELIVERY" || order.delivery_batch_id) {
      continue;
    }

    const session = firstRelation(order.pickup_sessions);
    const hostelId = session?.hostel_id;
    if (!hostelId) {
      continue;
    }

    const hostel = firstRelation(session?.hostels);
    const current = readyByHostel.get(hostelId) ?? {
      hostelName: hostel?.name ?? "Hostel",
      orderIds: [] as string[],
    };
    current.orderIds.push(String(order.id));
    readyByHostel.set(hostelId, current);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Deliveries</h2>
          <p className="text-sm text-muted-foreground">
            Create a batch, start it, then confirm at the scanner.
          </p>
        </div>
        <Button asChild>
          <Link href="/delivery/scan">Open scanner</Link>
        </Button>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Ready for a batch</h3>
        {readyByHostel.size === 0 ? (
          <EmptyState message="No laundry is waiting to be batched." />
        ) : (
          [...readyByHostel.entries()].map(([hostelId, group]) => (
            <Card key={hostelId}>
              <CardHeader>
                <CardTitle>{group.hostelName}</CardTitle>
                <CardDescription>
                  {group.orderIds.length} order
                  {group.orderIds.length === 1 ? "" : "s"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateDeliveryBatchButton
                  hostelId={hostelId}
                  orderIds={group.orderIds}
                />
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Batches</h3>
        {deliveryBatches.length === 0 ? (
          <EmptyState message="No open delivery batches." />
        ) : (
          deliveryBatches.map((batch) => {
            const hostel = firstRelation(batch.hostels);
            return (
              <Card key={batch.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{batch.batch_number}</CardTitle>
                      <CardDescription>
                        {hostel?.name ?? "Unknown hostel"}
                      </CardDescription>
                    </div>
                    <Badge>{getDeliveryBatchStatusLabel(batch.status)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {batch.status === "CREATED" ? (
                    <DeliveryBatchLifecycleButton
                      deliveryBatchId={batch.id}
                      action="READY"
                    />
                  ) : null}
                  {batch.status === "READY" ? (
                    <DeliveryBatchLifecycleButton
                      deliveryBatchId={batch.id}
                      action="START"
                    />
                  ) : null}
                  {batch.status === "OUT_FOR_DELIVERY" ? (
                    <p className="text-sm text-muted-foreground">
                      Confirm each bag with the hostel scanner. Do not choose a
                      status on the device.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Orders</h3>
        {orders.length === 0 ? (
          <EmptyState message="No laundry is currently in delivery." />
        ) : (
          orders.map((order) => {
            const bag = firstRelation(order.bags);
            const student = firstRelation(order.profiles);
            return (
              <OrderCard
                key={order.id}
                orderNumber={order.order_number}
                status={order.status}
                bagCode={bag?.bag_code}
                studentName={student?.full_name}
                createdAt={order.created_at}
              >
                {order.status === "OUT_FOR_DELIVERY" ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Scan this bag to confirm delivery or record a failed
                    attempt.
                  </p>
                ) : null}
                {order.status === "DELIVERY_ATTEMPTED" ? (
                  <RetryDeliveryButton orderId={order.id} />
                ) : null}
              </OrderCard>
            );
          })
        )}
      </section>
    </div>
  );
}
