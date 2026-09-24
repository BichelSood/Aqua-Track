import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/lib/errors";
import type { AppResult, ComplaintType } from "@/types";

export async function createComplaint(input: {
  laundryOrderId: string;
  type: ComplaintType;
  description: string;
}): Promise<AppResult<{ id: string; complaintNumber: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: toAppError("AUTHENTICATION_REQUIRED") };
  }

  const { data: order, error: orderError } = await supabase
    .from("laundry_orders")
    .select("id")
    .eq("id", input.laundryOrderId)
    .eq("student_id", user.id)
    .single();

  if (orderError || !order) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "That laundry order was not found.",
      },
    };
  }

  const complaintNumber =
    "CMP-" +
    new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      complaint_number: complaintNumber,
      laundry_order_id: input.laundryOrderId,
      reported_by: user.id,
      type: input.type,
      description: input.description,
      status: "OPEN",
    })
    .select("id, complaint_number")
    .single();

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  return {
    success: true,
    data: {
      id: data.id,
      complaintNumber: data.complaint_number,
    },
  };
}
