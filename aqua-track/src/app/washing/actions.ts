"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TransitionState = {
  success: boolean;
  message: string;
};

export async function transitionLaundryStatus(
  _previousState: TransitionState,
  formData: FormData,
): Promise<TransitionState> {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const toStatus = String(formData.get("toStatus") ?? "").trim();

  if (!orderId || !toStatus) {
    return {
      success: false,
      message: "Missing status transition information.",
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

  const { error } = await supabase.rpc("transition_laundry_status", {
    p_order_id: orderId,
    p_to_status: toStatus,
    p_changed_by: user.id,
    p_reason: null,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/washing");

  return {
    success: true,
    message: `Order moved to ${toStatus}.`,
  };
}