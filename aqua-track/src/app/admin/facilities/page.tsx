import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/require-role";
import {
  getAdminFacilities,
  getAdminHostels,
} from "@/features/admin/get-admin-lists";
import { LocationCreateForm } from "./location-create-form";
import { LocationActiveForm } from "./location-active-form";

export default async function AdminFacilitiesPage() {
  await requireRole("ADMIN");
  const [hostels, facilities] = await Promise.all([
    getAdminHostels(),
    getAdminFacilities(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Facilities</h2>
        <p className="text-sm text-muted-foreground">
          Hostels and washing facilities.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Hostels</h3>
        <LocationCreateForm kind="hostel" />
        <DataTable
          getRowId={(row) => row.id}
          emptyMessage="No hostels found."
          rows={hostels}
          columns={[
            { key: "name", header: "Name", cell: (row) => row.name },
            { key: "code", header: "Code", cell: (row) => row.code },
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
                <LocationActiveForm
                  kind="hostel"
                  location={row}
                />
              ),
            },
          ]}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Washing facilities</h3>
        <LocationCreateForm kind="facility" />
        <DataTable
          getRowId={(row) => row.id}
          emptyMessage="No facilities found."
          rows={facilities}
          columns={[
            { key: "name", header: "Name", cell: (row) => row.name },
            { key: "code", header: "Code", cell: (row) => row.code },
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
                <LocationActiveForm kind="facility" location={row} />
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
