export const USER_ROLES = [
  "STUDENT",
  "DELIVERY_BOY",
  "WASHING_STAFF",
  "ADMIN",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const LAUNDRY_STATUSES = [
  "COLLECTED",
  "RECEIVED_AT_FACILITY",
  "UNDER_WASHING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERY_ATTEMPTED",
  "DELIVERED",
] as const;

export type LaundryStatus = (typeof LAUNDRY_STATUSES)[number];

export const ACTIVE_LAUNDRY_STATUSES = LAUNDRY_STATUSES.filter(
  (status) => status !== "DELIVERED",
);

export const PICKUP_SESSION_STATUSES = [
  "SCHEDULED",
  "ANNOUNCED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const;

export type PickupSessionStatus = (typeof PICKUP_SESSION_STATUSES)[number];

export const WASHING_BATCH_STATUSES = [
  "CREATED",
  "RECEIVED",
  "PROCESSING",
  "COMPLETED",
] as const;

export type WashingBatchStatus = (typeof WASHING_BATCH_STATUSES)[number];

export const DELIVERY_BATCH_STATUSES = [
  "CREATED",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
] as const;

export type DeliveryBatchStatus = (typeof DELIVERY_BATCH_STATUSES)[number];

export const COMPLAINT_TYPES = [
  "MISSING_ITEM",
  "DAMAGED_ITEM",
  "WRONG_LAUNDRY",
  "DELIVERY_PROBLEM",
  "OTHER",
] as const;

export type ComplaintType = (typeof COMPLAINT_TYPES)[number];

export const COMPLAINT_STATUSES = [
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "CLOSED",
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const WASHING_TRANSITION_TARGETS = [
  "RECEIVED_AT_FACILITY",
  "UNDER_WASHING",
  "READY_FOR_DELIVERY",
] as const satisfies readonly LaundryStatus[];

export const DELIVERY_TRANSITION_TARGETS = [
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_ATTEMPTED",
] as const satisfies readonly LaundryStatus[];

export const SCANNER_OPERATIONS = [
  "COLLECT",
  "DELIVER",
  "INFO",
  "ERROR",
] as const;

export type ScannerOperation = (typeof SCANNER_OPERATIONS)[number];

export const WASHING_SCAN_OPERATIONS = [
  "START_WASHING",
  "COMPLETE_WASHING",
  "INFO",
  "ERROR",
] as const;

export type WashingScanOperation = (typeof WASHING_SCAN_OPERATIONS)[number];
