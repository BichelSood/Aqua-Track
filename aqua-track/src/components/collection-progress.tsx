import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";

export function CollectionProgress({
  orders,
}: {
  orders: Array<{
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    bagCode?: string | null;
    studentName?: string | null;
  }>;
}) {
  if (orders.length === 0) {
    return <EmptyState message="No bags collected in this pickup yet." />;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {orders.length} bag{orders.length === 1 ? "" : "s"} collected
      </p>
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          orderNumber={order.order_number}
          status={order.status}
          bagCode={order.bagCode}
          studentName={order.studentName}
          createdAt={order.created_at}
        />
      ))}
    </div>
  );
}
