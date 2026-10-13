import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { SearchBar } from "@/components/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminUsers } from "@/features/admin/get-admin-lists";
import { getUserRoleLabel } from "@/lib/labels";
import { USER_ROLES } from "@/types";
import { firstRelation } from "@/lib/relations";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  await requireRole("ADMIN");
  const { q, role } = await searchParams;
  const { rows } = await getAdminUsers({ q, role });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
        <p className="text-sm text-muted-foreground">
          Main-admin role management for students and operational staff.
        </p>
      </div>

      <form className="flex flex-wrap gap-3" action="/admin/users">
        <SearchBar placeholder="Search name" defaultValue={q} />
        <select
          name="role"
          defaultValue={role ?? ""}
          className="h-9 rounded-md border bg-transparent px-2 text-sm"
        >
          <option value="">All roles</option>
          {USER_ROLES.map((item) => (
            <option key={item} value={item}>
              {getUserRoleLabel(item)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <DataTable
        getRowId={(row) => row.id}
        emptyMessage="No users found."
        rows={rows}
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (row) => (
              <Link href={`/admin/users/${row.id}`} className="underline">
                {row.full_name}
              </Link>
            ),
          },
          {
            key: "role",
            header: "Role",
            cell: (row) => getUserRoleLabel(row.role),
          },
          {
            key: "hostel",
            header: "Hostel",
            cell: (row) => firstRelation(row.hostels)?.name ?? "—",
          },
          {
            key: "active",
            header: "Active",
            cell: (row) => (
              <Badge>{row.is_active ? "Active" : "Inactive"}</Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
