import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import {
  getAdminFacilities,
  getAdminHostels,
  getAdminUser,
} from "@/features/admin/get-admin-lists";
import { UserEditForm } from "./user-edit-form";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;
  const [user, hostels, facilities] = await Promise.all([
    getAdminUser(id),
    getAdminHostels(),
    getAdminFacilities(),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{user.full_name}</h2>
        <p className="text-sm text-muted-foreground">
          Role and assignment. Only the main administrator can save role
          changes. Admin accounts are managed separately.
        </p>
      </div>
      <UserEditForm user={user} hostels={hostels} facilities={facilities} />
    </div>
  );
}
