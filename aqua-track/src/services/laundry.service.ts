import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/lib/errors";
import { getLaundryStatusLabel } from "@/lib/labels";
import type { AppResult, LaundryStatus } from "@/types";

export type TransitionedOrder = {
  id: string;
  orderNumber: string;
  status: LaundryStatus;
};

export async function transitionOrderStatus(input: {
  orderId: string;
  targetStatus: LaundryStatus;
  reason?: string | null;
}): Promise<AppResult<TransitionedOrder>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: toAppError("AUTHENTICATION_REQUIRED"),
    };
  }

  const { data, error } = await supabase.rpc("transition_laundry_status", {
    p_order_id: input.orderId,
    p_to_status: input.targetStatus,
    p_changed_by: user.id,
    p_reason: input.reason ?? null,
  });

  if (error) {
    return {
      success: false,
      error: toAppError(error),
    };
  }

  const order = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    data: {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
    },
  };
}

export function transitionSuccessMessage(status: LaundryStatus): string {
  return `Order moved to ${getLaundryStatusLabel(status)}.`;
}

export async function adminOverrideOrderStatus(input: {
  orderId: string;
  targetStatus: LaundryStatus;
  reason: string;
}): Promise<AppResult<TransitionedOrder>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: toAppError("AUTHENTICATION_REQUIRED"),
    };
  }

  const { data, error } = await supabase.rpc("admin_override_laundry_status", {
    p_order_id: input.orderId,
    p_to_status: input.targetStatus,
    p_reason: input.reason,
  });

  if (error) {
    return {
      success: false,
      error: toAppError(error),
    };
  }

  const order = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    data: {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
    },
  };
}
