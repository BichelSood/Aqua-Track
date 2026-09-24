import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { requireRole } from "@/lib/auth/require-role";
import { getStudentOrders } from "@/features/student/get-dashboard-data";
import { firstRelation } from "@/lib/relations";

export default async function LaundryListPage() {
  const profile = await requireRole("STUDENT");
  const orders = await getStudentOrders(profile.id, "active");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Laundry</h2>
        <p className="text-sm text-muted-foreground">
          Active orders that are still in the laundry workflow.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState message="You do not have any active laundry." />
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
