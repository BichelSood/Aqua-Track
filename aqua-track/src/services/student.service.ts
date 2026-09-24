import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/lib/errors";
import type { AppResult } from "@/types";

export async function sendStudentMessage(input: {
  receiverId: string;
  laundryOrderId: string;
  message: string;
}): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: toAppError("AUTHENTICATION_REQUIRED") };
  }

  const { data: order } = await supabase
    .from("laundry_orders")
    .select("id, pickup_session_id")
    .eq("id", input.laundryOrderId)
    .eq("student_id", user.id)
    .single();

  if (!order) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "That laundry order was not found.",
      },
    };
  }

  const { data: session } = await supabase
    .from("pickup_sessions")
    .select("delivery_boy_id")
    .eq("id", order.pickup_session_id)
    .single();

  if (!session || session.delivery_boy_id !== input.receiverId) {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You can only message the delivery staff for this order.",
      },
    };
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: input.receiverId,
      laundry_order_id: input.laundryOrderId,
      message: input.message,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  return { success: true, data: { id: data.id } };
}

export async function updateStudentProfile(input: {
  fullName: string;
  phone?: string;
  roomNumber?: string;
}): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: toAppError("AUTHENTICATION_REQUIRED") };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      phone: input.phone || null,
      room_number: input.roomNumber || null,
    })
    .eq("id", user.id)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  return { success: true, data: { id: data.id } };
}
