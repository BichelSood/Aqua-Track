import { DataTable } from "@/components/data-table";
import { SearchBar } from "@/components/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { getAdminBags, getAdminStudents } from "@/features/admin/get-admin-lists";
import { firstRelation } from "@/lib/relations";
import { CreateBagForm } from "./create-bag-form";
import { BagActiveForm } from "./bag-active-form";

export default async function AdminBagsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole("ADMIN");
  const { q } = await searchParams;
  const [{ rows }, students] = await Promise.all([
    getAdminBags({ q }),
    getAdminStudents(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Bags</h2>
        <p className="text-sm text-muted-foreground">
          Register a permanent bag identity. QR tokens do not include student
          personal data.
        </p>
      </div>

      <CreateBagForm students={students} />

      <form className="flex flex-wrap gap-3" action="/admin/bags">
        <SearchBar placeholder="Search bag code" defaultValue={q} />
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <DataTable
        getRowId={(row) => row.id}
        emptyMessage="No bags found."
        rows={rows}
        columns={[
          {
            key: "code",
            header: "Bag",
            cell: (row) => row.bag_code,
          },
          {
            key: "owner",
            header: "Owner",
            cell: (row) => firstRelation(row.profiles)?.full_name ?? "—",
          },
          {
            key: "active",
            header: "Active",
            cell: (row) => (
              <Badge>{row.is_active ? "Active" : "Inactive"}</Badge>
            ),
          },
          {
            key: "toggle",
            header: "",
            cell: (row) => (
              <BagActiveForm bagId={row.id} isActive={row.is_active} />
            ),
          },
        ]}
      />
    </div>
  );
}
