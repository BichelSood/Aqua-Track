"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUserRoleLabel } from "@/lib/labels";
import { MANAGED_USER_ROLES } from "@/types";
import { updateUserAction, type AdminFormState } from "../../actions";

const initialState: AdminFormState = { success: false, message: "" };

export function UserEditForm({
  user,
  hostels,
  facilities,
}: {
  user: {
    id: string;
    full_name: string;
    role: string;
    is_active: boolean;
    hostel_id: string | null;
    facility_id: string | null;
  };
  hostels: { id: string; name: string; code: string }[];
  facilities: { id: string; name: string; code: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    updateUserAction,
    initialState,
  );
  const adminManagedExternally = user.role === "ADMIN";

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <input type="hidden" name="userId" value={user.id} />
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full name
        </label>
        <Input id="fullName" name="fullName" defaultValue={user.full_name} required />
      </div>
      <div className="space-y-2">
        <label htmlFor="role" className="text-sm font-medium">
          Role
        </label>
        <select
          id="role"
          name="role"
          defaultValue={user.role}
          disabled={adminManagedExternally}
          className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
        >
          {adminManagedExternally ? (
            <option value="ADMIN">{getUserRoleLabel("ADMIN")}</option>
          ) : null}
          {MANAGED_USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {getUserRoleLabel(role)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="isActive" className="text-sm font-medium">
          Status
        </label>
        <select
          id="isActive"
          name="isActive"
          defaultValue={user.is_active ? "true" : "false"}
          disabled={adminManagedExternally}
          className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="hostelId" className="text-sm font-medium">
          Hostel
        </label>
        <select
          id="hostelId"
          name="hostelId"
          defaultValue={user.hostel_id ?? ""}
          className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
        >
          <option value="">None</option>
          {hostels.map((hostel) => (
            <option key={hostel.id} value={hostel.id}>
              {hostel.name} ({hostel.code})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="facilityId" className="text-sm font-medium">
          Facility
        </label>
        <select
          id="facilityId"
          name="facilityId"
          defaultValue={user.facility_id ?? ""}
          className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
        >
          <option value="">None</option>
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name} ({facility.code})
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending || adminManagedExternally}>
        {pending ? "Saving..." : "Save user"}
      </Button>
      {adminManagedExternally ? (
        <p className="text-sm text-muted-foreground">
          Admin accounts are managed through a trusted database process.
        </p>
      ) : null}
      {state.message ? (
        <p
          className={
            state.success ? "text-sm text-success" : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
