import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { requireRole } from "@/lib/auth/require-role";
import { getStudentOrders } from "@/features/student/get-dashboard-data";
import { firstRelation } from "@/lib/relations";

export default async function HistoryPage() {
  const profile = await requireRole("STUDENT");
  const orders = await getStudentOrders(profile.id, "history");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">History</h2>
        <p className="text-sm text-muted-foreground">
          Delivered laundry stays here for support and disputes.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState message="No completed laundry yet." />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              orderNumber={order.order_number}
              status={order.status}
              bagCode={firstRelation(order.bags)?.bag_code}
              createdAt={order.created_at}
              href={`/laundry/${order.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
