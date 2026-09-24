import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { getWashingQueue } from "@/features/washing/get-washing-data";
import { firstRelation } from "@/lib/relations";
import { QueueActionButton } from "../queue-action-button";

export default async function WashingQueuePage() {
  await requireRole("WASHING_STAFF");
  const queue = await getWashingQueue();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Queue</h2>
          <p className="text-sm text-muted-foreground">
            Start washing and mark bags washed one at a time.
          </p>
        </div>
        <Button asChild>
          <Link href="/washing/scan">Open scanner</Link>
        </Button>
      </div>

      {queue.length === 0 ? (
        <EmptyState message="No laundry orders are currently waiting for processing." />
      ) : (
        <div className="space-y-4">
          {queue.map((order) => {
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
                <div className="mt-4">
                  {order.status === "COLLECTED" ? (
                    <p className="text-sm text-muted-foreground">
                      Waiting for the washing batch to be received.
                    </p>
                  ) : null}
                  {order.status === "RECEIVED_AT_FACILITY" ? (
                    <QueueActionButton orderId={order.id} action="START" />
                  ) : null}
                  {order.status === "UNDER_WASHING" ? (
                    <QueueActionButton orderId={order.id} action="COMPLETE" />
                  ) : null}
                </div>
              </OrderCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
