"use server";

import { revalidatePath } from "next/cache";
import { fromZodError } from "@/lib/errors";
import {
  createComplaintSchema,
  messageSchema,
  updateStudentProfileSchema,
} from "@/lib/validation/schemas";
import { createComplaint } from "@/services/complaint.service";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service";
import {
  sendStudentMessage,
  updateStudentProfile,
} from "@/services/student.service";

export type StudentFormState = {
  success: boolean;
  message: string;
};

export async function markNotificationReadAction(
  _previousState: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const notificationId = String(formData.get("notificationId") ?? "");
  const result = await markNotificationRead(notificationId);

  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/laundry");
  return { success: true, message: "Marked as read." };
}

export async function markAllNotificationsReadAction(
  previousState: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  void previousState;
  void formData;
  const result = await markAllNotificationsRead();

  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true, message: "All notifications marked as read." };
}

export async function createComplaintAction(
  _previousState: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const parsed = createComplaintSchema.safeParse({
    laundryOrderId: String(formData.get("laundryOrderId") ?? ""),
    type: String(formData.get("type") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await createComplaint(parsed.data);

  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidatePath("/complaints");
  return {
    success: true,
    message: `Complaint ${result.data.complaintNumber} submitted.`,
  };
}

export async function sendMessageAction(
  _previousState: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const parsed = messageSchema.safeParse({
    receiverId: String(formData.get("receiverId") ?? ""),
    laundryOrderId: String(formData.get("laundryOrderId") ?? ""),
    message: String(formData.get("message") ?? ""),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  if (!parsed.data.laundryOrderId) {
    return { success: false, message: "Laundry order is required." };
  }

  const result = await sendStudentMessage({
    receiverId: parsed.data.receiverId,
    laundryOrderId: parsed.data.laundryOrderId,
    message: parsed.data.message,
  });

  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidatePath(`/laundry/${parsed.data.laundryOrderId}`);
  return { success: true, message: "Message sent." };
}

export async function updateProfileAction(
  _previousState: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const parsed = updateStudentProfileSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    roomNumber: String(formData.get("roomNumber") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await updateStudentProfile(parsed.data);

  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, message: "Profile updated." };
}
