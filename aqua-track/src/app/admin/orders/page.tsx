import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { SearchBar } from "@/components/search-bar";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminOrders } from "@/features/admin/get-admin-lists";
import { getLaundryStatusLabel } from "@/lib/labels";
import { LAUNDRY_STATUSES } from "@/types";
import { firstRelation } from "@/lib/relations";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireRole("ADMIN");
  const { q, status } = await searchParams;
  const { rows } = await getAdminOrders({ q, status });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Orders</h2>
        <p className="text-sm text-muted-foreground">
          All laundry orders. Corrections require a reason.
        </p>
      </div>

      <form className="flex flex-wrap gap-3" action="/admin/orders">
        <SearchBar placeholder="Search order number" defaultValue={q} />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-md border bg-transparent px-2 text-sm"
        >
          <option value="">All statuses</option>
          {LAUNDRY_STATUSES.map((item) => (
            <option key={item} value={item}>
              {getLaundryStatusLabel(item)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <DataTable
        getRowId={(row) => row.id}
        emptyMessage="No orders found."
        rows={rows}
        columns={[
          {
            key: "order",
            header: "Order",
            cell: (row) => (
              <Link href={`/admin/orders/${row.id}`} className="underline">
                {row.order_number}
              </Link>
            ),
          },
          {
            key: "student",
            header: "Student",
            cell: (row) => firstRelation(row.profiles)?.full_name ?? "—",
          },
          {
            key: "bag",
            header: "Bag",
            cell: (row) => firstRelation(row.bags)?.bag_code ?? "—",
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: "created",
            header: "Created",
            cell: (row) => new Date(row.created_at).toLocaleString(),
          },
        ]}
      />
    </div>
  );
}
