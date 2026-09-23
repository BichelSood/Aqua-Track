"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreatePickupSessionState = {
  success: boolean;
  message: string;
};

export async function createPickupSession(
  _previousState: CreatePickupSessionState,
  formData: FormData,
): Promise<CreatePickupSessionState> {
  const hostelId = String(formData.get("hostelId") ?? "").trim();
  const deliveryBoyId = String(
    formData.get("deliveryBoyId") ?? "",
  ).trim();
  const scheduledDate = String(
    formData.get("scheduledDate") ?? "",
  ).trim();
  const startTime = String(
    formData.get("startTime") ?? "",
  ).trim();
  const endTime = String(
    formData.get("endTime") ?? "",
  ).trim();

  if (
    !hostelId ||
    !deliveryBoyId ||
    !scheduledDate ||
    !startTime ||
    !endTime
  ) {
    return {
      success: false,
      message: "Please complete all pickup session fields.",
    };
  }

  if (endTime <= startTime) {
    return {
      success: false,
      message: "End time must be later than start time.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "Authentication required.",
    };
  }

  const { error } = await supabase.rpc("create_pickup_session", {
    p_hostel_id: hostelId,
    p_delivery_boy_id: deliveryBoyId,
    p_scheduled_date: scheduledDate,
    p_start_time: startTime,
    p_end_time: endTime,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin");

  return {
    success: true,
    message: "Pickup session created successfully.",
  };
}