import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/lib/errors";
import { parseScannerPayload } from "@/lib/scanner";
import { transitionOrderStatus } from "@/services/laundry.service";
import type { AppResult, LaundryStatus } from "@/types";

export type LookedUpOrder = {
  id: string;
  orderNumber: string;
  status: LaundryStatus;
  bagId: string;
  bagCode: string;
  qrToken: string;
  studentId: string;
  studentName: string;
  rollNumber: string | null;
  hostelId: string | null;
  roomNumber: string | null;
};

export async function findLaundryByIdentifier(
  identifier: string,
): Promise<AppResult<LookedUpOrder>> {
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

  const { data, error } = await supabase.rpc("find_laundry_by_identifier", {
    p_identifier: identifier,
  });

  if (error) {
    return {
      success: false,
      error: toAppError(error),
    };
  }

  const order = Array.isArray(data) ? data[0] : data;

  if (!order) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "No active laundry order found for this identifier.",
      },
    };
  }

  return {
    success: true,
    data: {
      id: order.order_id,
      orderNumber: order.order_number,
      status: order.order_status,
      bagId: order.bag_id,
      bagCode: order.bag_code,
      qrToken: order.qr_token,
      studentId: order.student_id,
      studentName: order.student_name,
      rollNumber: order.roll_number,
      hostelId: order.hostel_id,
      roomNumber: order.room_number,
    },
  };
}

export async function receiveWashingBatch(
  washingBatchId: string,
): Promise<AppResult<{ id: string; status: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("receive_washing_batch", {
    p_washing_batch_id: washingBatchId,
  });

  if (error) {
    return {
      success: false,
      error: toAppError(error),
    };
  }

  const batch = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    data: {
      id: batch.id,
      status: batch.status,
    },
  };
}

export async function resolveWashingScan(identifier: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_washing_scan", {
    p_identifier: identifier,
  });

  if (error) {
    return {
      success: false as const,
      error: toAppError(error),
    };
  }

  const parsed = parseScannerPayload(data);

  if (!parsed.success) {
    return {
      success: false as const,
      error: {
        code: parsed.code ?? "NOT_FOUND",
        message: parsed.message,
      },
    };
  }

  return { success: true as const, data: parsed };
}

export async function confirmWashingScan(identifier: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_washing_scan", {
    p_identifier: identifier,
  });

  if (error) {
    return {
      success: false as const,
      error: toAppError(error),
    };
  }

  const parsed = parseScannerPayload(data);

  if (!parsed.success) {
    return {
      success: false as const,
      error: {
        code: parsed.code ?? "INVALID_STATUS_TRANSITION",
        message: parsed.message,
      },
    };
  }

  return { success: true as const, data: parsed };
}

export async function startWashing(orderId: string) {
  return transitionOrderStatus({
    orderId,
    targetStatus: "UNDER_WASHING",
  });
}

export async function markWashed(orderId: string) {
  return transitionOrderStatus({
    orderId,
    targetStatus: "READY_FOR_DELIVERY",
  });
}
