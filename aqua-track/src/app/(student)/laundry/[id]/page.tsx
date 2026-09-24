import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { LaundryTimeline } from "@/components/laundry-timeline";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getStudentOrderDetail } from "@/features/student/get-dashboard-data";
import { firstRelation } from "@/lib/relations";
import { MessageForm } from "./message-form";

export default async function LaundryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("STUDENT");
  const { id } = await params;
  const detail = await getStudentOrderDetail(profile.id, id);

  if (!detail) {
    notFound();
  }

  const { order, statusHistory, deliveryBoyId, messages } = detail;
  const bag = firstRelation(order.bags);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/laundry" className="underline">
            Laundry
          </Link>
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          {order.order_number}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          {bag?.bag_code ? (
            <p className="text-sm text-muted-foreground">Bag {bag.bag_code}</p>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {statusHistory.length === 0 ? (
            <EmptyState message="No status history yet." />
          ) : (
            <LaundryTimeline
              entries={statusHistory.map((entry) => ({
                id: entry.id,
                toStatus: entry.to_status,
                fromStatus: entry.from_status,
                createdAt: entry.created_at,
                reason: entry.reason,
              }))}
            />
          )}
        </CardContent>
      </Card>

      <p className="text-sm">
        <Link href={`/complaints?orderId=${order.id}`} className="underline">
          Report a problem with this laundry
        </Link>
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? (
            <EmptyState message="No messages yet." />
          ) : (
            <ul className="space-y-3">
              {messages.map((message) => (
                <li key={message.id} className="rounded-md border p-3 text-sm">
                  <p>
                    {message.sender_id === profile.id ? "You" : "Delivery staff"}
                  </p>
                  <p className="mt-1">{message.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {deliveryBoyId ? (
            <MessageForm
              laundryOrderId={order.id}
              receiverId={deliveryBoyId}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Delivery staff is not assigned for this order yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
