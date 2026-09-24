import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminBatches } from "@/features/admin/get-admin-lists";
import {
  getDeliveryBatchStatusLabel,
  getWashingBatchStatusLabel,
} from "@/lib/labels";
import { firstRelation } from "@/lib/relations";

export default async function AdminBatchesPage() {
  await requireRole("ADMIN");
  const { washing, delivery } = await getAdminBatches();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Batches</h2>
        <p className="text-sm text-muted-foreground">
          Washing and delivery batches.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Washing</h3>
        <DataTable
          getRowId={(row) => row.id}
          emptyMessage="No washing batches."
          rows={washing}
          columns={[
            { key: "number", header: "Batch", cell: (row) => row.batch_number },
            {
              key: "facility",
              header: "Facility",
              cell: (row) => firstRelation(row.facilities)?.name ?? "—",
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => (
                <Badge>{getWashingBatchStatusLabel(row.status)}</Badge>
              ),
            },
            {
              key: "created",
              header: "Created",
              cell: (row) => new Date(row.created_at).toLocaleString(),
            },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Delivery</h3>
        <DataTable
          getRowId={(row) => row.id}
          emptyMessage="No delivery batches."
          rows={delivery}
          columns={[
            { key: "number", header: "Batch", cell: (row) => row.batch_number },
            {
              key: "hostel",
              header: "Hostel",
              cell: (row) => firstRelation(row.hostels)?.name ?? "—",
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => (
                <Badge>{getDeliveryBatchStatusLabel(row.status)}</Badge>
              ),
            },
            {
              key: "created",
              header: "Created",
              cell: (row) => new Date(row.created_at).toLocaleString(),
            },
          ]}
        />
      </section>
    </div>
  );
}
