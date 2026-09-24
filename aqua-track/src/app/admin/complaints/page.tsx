import { ComplaintCard } from "@/components/complaint-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminComplaints } from "@/features/admin/get-admin-lists";
import {
  getComplaintStatusLabel,
  getComplaintTypeLabel,
} from "@/lib/labels";
import { COMPLAINT_STATUSES } from "@/types";
import { ComplaintStatusForm } from "./complaint-status-form";

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");
  const { status } = await searchParams;
  const complaints = await getAdminComplaints({ status });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Complaints</h2>
        <p className="text-sm text-muted-foreground">
          Review and update complaint status.
        </p>
      </div>

      <form className="flex flex-wrap gap-3" action="/admin/complaints">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-md border bg-transparent px-2 text-sm"
        >
          <option value="">All statuses</option>
          {COMPLAINT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {getComplaintStatusLabel(item)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {complaints.length === 0 ? (
        <EmptyState message="No complaints found." />
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="space-y-2">
              <ComplaintCard
                complaintNumber={complaint.complaint_number}
                typeLabel={getComplaintTypeLabel(complaint.type)}
                statusLabel={getComplaintStatusLabel(complaint.status)}
                description={complaint.description}
                createdAt={complaint.created_at}
              />
              <ComplaintStatusForm
                complaintId={complaint.id}
                status={complaint.status}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
