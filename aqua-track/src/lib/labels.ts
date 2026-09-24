import type {
  ComplaintStatus,
  ComplaintType,
  DeliveryBatchStatus,
  LaundryStatus,
  PickupSessionStatus,
  UserRole,
  WashingBatchStatus,
} from "@/types";

export const laundryStatusLabels: Record<LaundryStatus, string> = {
  COLLECTED: "Collected",
  RECEIVED_AT_FACILITY: "Received at Facility",
  UNDER_WASHING: "Under Washing",
  READY_FOR_DELIVERY: "Ready for Delivery",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERY_ATTEMPTED: "Delivery Attempted",
  DELIVERED: "Delivered",
};

export const pickupSessionStatusLabels: Record<PickupSessionStatus, string> = {
  SCHEDULED: "Scheduled",
  ANNOUNCED: "Announced",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const washingBatchStatusLabels: Record<WashingBatchStatus, string> = {
  CREATED: "Created",
  RECEIVED: "Received",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
};

export const deliveryBatchStatusLabels: Record<DeliveryBatchStatus, string> = {
  CREATED: "Created",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  COMPLETED: "Completed",
};

export const userRoleLabels: Record<UserRole, string> = {
  STUDENT: "Student",
  DELIVERY_BOY: "Delivery Staff",
  WASHING_STAFF: "Washing Staff",
  ADMIN: "Admin",
};

export const userRoleGroupLabels: Record<UserRole, string> = {
  STUDENT: "Students",
  DELIVERY_BOY: "Delivery Staff",
  WASHING_STAFF: "Washing Staff",
  ADMIN: "Admins",
};

export const complaintTypeLabels: Record<ComplaintType, string> = {
  MISSING_ITEM: "Missing Item",
  DAMAGED_ITEM: "Damaged Item",
  WRONG_LAUNDRY: "Wrong Laundry",
  DELIVERY_PROBLEM: "Delivery Problem",
  OTHER: "Other",
};

export const complaintStatusLabels: Record<ComplaintStatus, string> = {
  OPEN: "Open",
  IN_REVIEW: "In Review",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export function getLaundryStatusLabel(status: string): string {
  return laundryStatusLabels[status as LaundryStatus] ?? status;
}

export function getPickupSessionStatusLabel(status: string): string {
  return pickupSessionStatusLabels[status as PickupSessionStatus] ?? status;
}

export function getWashingBatchStatusLabel(status: string): string {
  return washingBatchStatusLabels[status as WashingBatchStatus] ?? status;
}

export function getDeliveryBatchStatusLabel(status: string): string {
  return deliveryBatchStatusLabels[status as DeliveryBatchStatus] ?? status;
}

export function getUserRoleLabel(role: string): string {
  return userRoleLabels[role as UserRole] ?? role;
}

export function getUserRoleGroupLabel(role: string): string {
  return userRoleGroupLabels[role as UserRole] ?? role;
}

export function getComplaintTypeLabel(type: string): string {
  return complaintTypeLabels[type as ComplaintType] ?? type;
}

export function getComplaintStatusLabel(status: string): string {
  return complaintStatusLabels[status as ComplaintStatus] ?? status;
}
