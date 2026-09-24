import { DataTable } from "@/components/data-table";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminAuditLogs } from "@/features/admin/get-admin-lists";

export default async function AdminAuditPage() {
  await requireRole("ADMIN");
  const logs = await getAdminAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Audit logs</h2>
        <p className="text-sm text-muted-foreground">
          Administrative corrections and management actions.
        </p>
      </div>

      <DataTable
        getRowId={(row) => row.id}
        emptyMessage="No audit entries yet."
        rows={logs}
        columns={[
          {
            key: "when",
            header: "When",
            cell: (row) => new Date(row.created_at).toLocaleString(),
          },
          { key: "action", header: "Action", cell: (row) => row.action },
          {
            key: "entity",
            header: "Entity",
            cell: (row) => row.entity_type,
          },
        ]}
      />
    </div>
  );
}
