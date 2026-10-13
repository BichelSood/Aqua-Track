import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/lib/errors";
import type { AppResult, ComplaintStatus, ManagedUserRole } from "@/types";

async function writeAudit(
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await createClient();
  await supabase.rpc("write_admin_audit", {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_metadata: metadata,
  });
}

export async function adminUpdateUser(input: {
  userId: string;
  fullName: string;
  role: ManagedUserRole;
  isActive: boolean;
  hostelId?: string;
  facilityId?: string;
}): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: toAppError("AUTHENTICATION_REQUIRED") };
  }

  const { data, error } = await supabase.rpc("admin_update_user_profile", {
    p_user_id: input.userId,
    p_full_name: input.fullName,
    p_role: input.role,
    p_is_active: input.isActive,
    p_hostel_id: input.hostelId ?? null,
    p_facility_id: input.facilityId ?? null,
  });

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  return { success: true, data: { id: data ?? input.userId } };
}

export async function adminCreateLocation(
  table: "hostels" | "facilities",
  input: { name: string; code: string; address?: string },
): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .insert({
      name: input.name,
      code: input.code,
      address: input.address || null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  await writeAudit(
    table === "hostels" ? "ADMIN_CREATED_HOSTEL" : "ADMIN_CREATED_FACILITY",
    table,
    data.id,
    { code: input.code },
  );

  return { success: true, data: { id: data.id } };
}

export async function adminUpdateLocation(
  table: "hostels" | "facilities",
  input: {
    id: string;
    name: string;
    code: string;
    address?: string;
    isActive: boolean;
  },
): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .update({
      name: input.name,
      code: input.code,
      address: input.address || null,
      is_active: input.isActive,
    })
    .eq("id", input.id)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  await writeAudit(
    table === "hostels" ? "ADMIN_UPDATED_HOSTEL" : "ADMIN_UPDATED_FACILITY",
    table,
    data.id,
    { is_active: input.isActive },
  );

  return { success: true, data: { id: data.id } };
}

export async function adminCreateBag(input: {
  ownerId: string;
  bagCode: string;
}): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();
  const qrToken = randomBytes(16).toString("hex");

  const { data, error } = await supabase
    .from("bags")
    .insert({
      bag_code: input.bagCode,
      qr_token: qrToken,
      owner_id: input.ownerId,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  await writeAudit("ADMIN_CREATED_BAG", "bags", data.id, {
    bag_code: input.bagCode,
  });

  return { success: true, data: { id: data.id } };
}

export async function adminUpdateBag(input: {
  bagId: string;
  isActive: boolean;
}): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bags")
    .update({ is_active: input.isActive })
    .eq("id", input.bagId)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  await writeAudit(
    input.isActive ? "ADMIN_ENABLED_BAG" : "ADMIN_DISABLED_BAG",
    "bags",
    data.id,
    { is_active: input.isActive },
  );

  return { success: true, data: { id: data.id } };
}

export async function adminUpdateComplaint(input: {
  complaintId: string;
  status: ComplaintStatus;
}): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .update({
      status: input.status,
      resolved_at:
        input.status === "RESOLVED" || input.status === "CLOSED"
          ? new Date().toISOString()
          : null,
    })
    .eq("id", input.complaintId)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  await writeAudit("ADMIN_UPDATED_COMPLAINT", "complaints", data.id, {
    status: input.status,
  });

  return { success: true, data: { id: data.id } };
}
