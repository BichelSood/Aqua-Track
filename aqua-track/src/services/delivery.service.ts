import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/lib/errors";
import { parseScannerPayload } from "@/lib/scanner";
import {
  transitionOrderStatus,
  transitionSuccessMessage,
} from "@/services/laundry.service";
import type { AppResult, LaundryStatus } from "@/types";

export async function transitionDeliveryOrderStatus(input: {
  orderId: string;
  targetStatus: LaundryStatus;
  reason?: string | null;
}): Promise<AppResult<{ id: string; orderNumber: string; status: LaundryStatus }>> {
  return transitionOrderStatus(input);
}

export { transitionSuccessMessage };

export async function createDeliveryBatch(input: {
  hostelId: string;
  orderIds: string[];
}): Promise<AppResult<{ id: string; status: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_delivery_batch", {
    p_hostel_id: input.hostelId,
    p_order_ids: input.orderIds,
  });

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  const batch = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    data: { id: batch.id, status: batch.status },
  };
}

export async function markDeliveryBatchReady(
  deliveryBatchId: string,
): Promise<AppResult<{ id: string; status: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_delivery_batch_ready", {
    p_delivery_batch_id: deliveryBatchId,
  });

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  const batch = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    data: { id: batch.id, status: batch.status },
  };
}

export async function startDeliveryBatch(
  deliveryBatchId: string,
): Promise<AppResult<{ id: string; status: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_delivery_batch", {
    p_delivery_batch_id: deliveryBatchId,
  });

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  const batch = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    data: { id: batch.id, status: batch.status },
  };
}

export async function resolveUniversalScan(identifier: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_universal_scan", {
    p_identifier: identifier,
  });

  if (error) {
    return { success: false as const, error: toAppError(error) };
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

export async function confirmUniversalScan(identifier: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_universal_scan", {
    p_identifier: identifier,
  });

  if (error) {
    return { success: false as const, error: toAppError(error) };
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

export async function recordDeliveryAttempt(input: {
  identifier: string;
  reason: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_delivery_attempt", {
    p_identifier: input.identifier,
    p_reason: input.reason,
  });

  if (error) {
    return { success: false as const, error: toAppError(error) };
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

export async function retryDelivery(
  orderId: string,
): Promise<AppResult<{ id: string; orderNumber: string; status: LaundryStatus }>> {
  return transitionOrderStatus({
    orderId,
    targetStatus: "OUT_FOR_DELIVERY",
    reason: "Retry delivery after a failed attempt.",
  });
}
