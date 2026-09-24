import { EmptyState } from "@/components/empty-state";
import { ComplaintCard } from "@/components/complaint-card";
import { requireRole } from "@/lib/auth/require-role";
import {
  getStudentComplaints,
  getStudentOrders,
} from "@/features/student/get-dashboard-data";
import {
  getComplaintStatusLabel,
  getComplaintTypeLabel,
} from "@/lib/labels";
import { ComplaintForm } from "./complaint-form";

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const profile = await requireRole("STUDENT");
  const { orderId } = await searchParams;
  const [complaints, activeOrders, historyOrders] = await Promise.all([
    getStudentComplaints(profile.id),
    getStudentOrders(profile.id, "active"),
    getStudentOrders(profile.id, "history"),
  ]);

  const orders = [...activeOrders, ...historyOrders];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Complaints</h2>
        <p className="text-sm text-muted-foreground">
          Report a laundry problem and track its status.
        </p>
      </div>

      <ComplaintForm orders={orders} defaultOrderId={orderId} />

      {complaints.length === 0 ? (
        <EmptyState message="You have not submitted any complaints." />
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaintNumber={complaint.complaint_number}
              typeLabel={getComplaintTypeLabel(complaint.type)}
              statusLabel={getComplaintStatusLabel(complaint.status)}
              description={complaint.description}
              createdAt={complaint.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
