import type { LaundryStatus } from "@/types";

export type ScannerResult = {
  success: boolean;
  operation: string;
  code: string | null;
  message: string;
  bagCode?: string | null;
  studentName?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  orderStatus?: LaundryStatus | null;
  pickupSessionId?: string | null;
  deliveryBatchId?: string | null;
};

export function parseScannerPayload(data: unknown): ScannerResult {
  const payload = Array.isArray(data) ? data[0] : data;

  if (!payload || typeof payload !== "object") {
    return {
      success: false,
      operation: "ERROR",
      code: "NOT_FOUND",
      message: "No bag was found for that identifier.",
    };
  }

  const record = payload as Record<string, unknown>;

  return {
    success: Boolean(record.success),
    operation: String(record.operation ?? "ERROR"),
    code: record.code ? String(record.code) : null,
    message: String(record.message ?? ""),
    bagCode: record.bag_code ? String(record.bag_code) : null,
    studentName: record.student_name ? String(record.student_name) : null,
    orderId: record.order_id ? String(record.order_id) : null,
    orderNumber: record.order_number ? String(record.order_number) : null,
    orderStatus: record.order_status
      ? (String(record.order_status) as LaundryStatus)
      : null,
    pickupSessionId: record.pickup_session_id
      ? String(record.pickup_session_id)
      : null,
    deliveryBatchId: record.delivery_batch_id
      ? String(record.delivery_batch_id)
      : null,
  };
}
