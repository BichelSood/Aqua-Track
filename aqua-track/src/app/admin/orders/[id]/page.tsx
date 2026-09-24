import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminOrder } from "@/features/admin/get-admin-lists";
import { OverrideForm } from "./override-form";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;
  const order = await getAdminOrder(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {order.order_number}
        </h2>
        <p className="text-sm text-muted-foreground">
          Administrative correction. A reason is required and is audited.
        </p>
      </div>
      <OverrideForm orderId={order.id} currentStatus={order.status} />
    </div>
  );
}
