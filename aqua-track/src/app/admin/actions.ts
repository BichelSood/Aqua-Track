"use server";

import { revalidatePath } from "next/cache";
import { fromZodError } from "@/lib/errors";
import {
  adminCreateBagSchema,
  adminNamedLocationSchema,
  adminOverrideStatusSchema,
  adminUpdateBagSchema,
  adminUpdateComplaintSchema,
  adminUpdateNamedLocationSchema,
  adminUpdateUserSchema,
} from "@/lib/validation/schemas";
import {
  adminCreateBag,
  adminCreateLocation,
  adminUpdateBag,
  adminUpdateComplaint,
  adminUpdateLocation,
  adminUpdateUser,
} from "@/services/admin.service";
import { adminOverrideOrderStatus } from "@/services/laundry.service";

export type AdminFormState = {
  success: boolean;
  message: string;
};

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/bags");
  revalidatePath("/admin/facilities");
  revalidatePath("/admin/complaints");
  revalidatePath("/admin/audit");
  revalidatePath("/dashboard");
}

function readBool(formData: FormData, name: string) {
  return String(formData.get(name) ?? "") === "true";
}

export async function updateUserAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const hostelId = String(formData.get("hostelId") ?? "").trim();
  const facilityId = String(formData.get("facilityId") ?? "").trim();

  const parsed = adminUpdateUserSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    role: String(formData.get("role") ?? ""),
    isActive: readBool(formData, "isActive"),
    hostelId: hostelId || undefined,
    facilityId: facilityId || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await adminUpdateUser(parsed.data);
  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateAdmin();
  return { success: true, message: "User updated." };
}

export async function overrideOrderAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const parsed = adminOverrideStatusSchema.safeParse({
    orderId: String(formData.get("orderId") ?? ""),
    targetStatus: String(formData.get("targetStatus") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await adminOverrideOrderStatus(parsed.data);
  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateAdmin();
  return { success: true, message: "Status correction saved." };
}

export async function createHostelAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  return createLocation("hostels", formData);
}

export async function createFacilityAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  return createLocation("facilities", formData);
}

async function createLocation(
  table: "hostels" | "facilities",
  formData: FormData,
): Promise<AdminFormState> {
  const parsed = adminNamedLocationSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
    address: String(formData.get("address") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await adminCreateLocation(table, parsed.data);
  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateAdmin();
  return { success: true, message: `${table === "hostels" ? "Hostel" : "Facility"} created.` };
}

export async function updateHostelAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  return updateLocation("hostels", formData);
}

export async function updateFacilityAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  return updateLocation("facilities", formData);
}

async function updateLocation(
  table: "hostels" | "facilities",
  formData: FormData,
): Promise<AdminFormState> {
  const parsed = adminUpdateNamedLocationSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
    address: String(formData.get("address") ?? "").trim() || undefined,
    isActive: readBool(formData, "isActive"),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await adminUpdateLocation(table, parsed.data);
  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateAdmin();
  return { success: true, message: "Saved." };
}

export async function createBagAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const parsed = adminCreateBagSchema.safeParse({
    ownerId: String(formData.get("ownerId") ?? ""),
    bagCode: String(formData.get("bagCode") ?? ""),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await adminCreateBag(parsed.data);
  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateAdmin();
  return { success: true, message: "Bag registered." };
}

export async function updateBagAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const parsed = adminUpdateBagSchema.safeParse({
    bagId: String(formData.get("bagId") ?? ""),
    isActive: readBool(formData, "isActive"),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await adminUpdateBag(parsed.data);
  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateAdmin();
  return { success: true, message: "Bag updated." };
}

export async function updateComplaintAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const parsed = adminUpdateComplaintSchema.safeParse({
    complaintId: String(formData.get("complaintId") ?? ""),
    status: String(formData.get("status") ?? ""),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await adminUpdateComplaint(parsed.data);
  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateAdmin();
  return { success: true, message: "Complaint updated." };
}
