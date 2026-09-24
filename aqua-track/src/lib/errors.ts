import type { AppError } from "@/types";

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "You need to sign in to continue.",
  FORBIDDEN: "You are not allowed to perform this action.",
  NOT_FOUND: "We could not find that record.",
  VALIDATION_ERROR: "Please check the information you entered.",
  INVALID_QR: "This QR code is not valid.",
  BAG_ALREADY_ACTIVE: "This bag already has an active laundry order.",
  WRONG_HOSTEL: "This bag belongs to a different pickup location.",
  INVALID_STATUS_TRANSITION: "This laundry cannot move to that status.",
  BATCH_MISMATCH: "This laundry does not belong to the current batch.",
  ORDER_NOT_ASSIGNED: "This laundry is not assigned to you.",
  SESSION_NOT_ACTIVE: "Pickup is not active right now.",
  AUTHENTICATION_REQUIRED: "You need to sign in to continue.",
  ADMIN_ACCESS_REQUIRED: "Only an admin can perform this action.",
  WASHING_STAFF_ACCESS_REQUIRED: "Only washing staff can perform this action.",
  DELIVERY_BOY_NOT_ACTIVE: "Your delivery account is not active.",
  ACTOR_NOT_ACTIVE: "Your account is not active.",
  ACTOR_MISMATCH: "You are not allowed to perform this action.",
  ACTOR_REQUIRED: "You need to sign in to continue.",
  ROLE_NOT_ALLOWED: "Your role cannot perform this status change.",
  ADMIN_REASON_REQUIRED: "A reason is required for this correction.",
  IDENTIFIER_REQUIRED: "Please scan the QR code or enter a roll number.",
  BAG_NOT_FOUND: "No bag was found for that identifier.",
  BAG_NOT_ACTIVE: "This bag is not active.",
  STUDENT_NOT_FOUND: "The bag owner could not be found.",
  STUDENT_NOT_ACTIVE: "The bag owner is not active.",
  BAG_OWNER_NOT_IN_PICKUP_HOSTEL:
    "This bag belongs to a different pickup location.",
  BAG_ALREADY_HAS_ACTIVE_ORDER: "This bag already has an active laundry order.",
  PICKUP_SESSION_NOT_FOUND: "Pickup session was not found.",
  PICKUP_SESSION_NOT_ASSIGNED: "This pickup session is not assigned to you.",
  PICKUP_SESSION_NOT_ACTIVE: "Pickup is not active right now.",
  INVALID_PICKUP_SESSION_STATUS: "This pickup session cannot be updated yet.",
  LAUNDRY_ORDER_NOT_FOUND: "Laundry order was not found.",
  WASHING_BATCH_NOT_FOUND_FOR_PICKUP_SESSION:
    "No washing batch exists for this pickup session.",
  WASHING_FACILITY_NOT_CONFIGURED: "The washing facility is not configured.",
  INVALID_HOSTEL: "Please choose a valid hostel.",
  INVALID_DELIVERY_BOY: "Please choose valid delivery staff.",
  INVALID_TIME_RANGE: "End time must be later than start time.",
  WASHING_FACILITY_NOT_ASSIGNED: "You are not assigned to a washing facility.",
  WASHING_BATCH_NOT_FOUND: "Washing batch was not found.",
  BATCH_NOT_RECEIVED: "Receive the washing batch before processing individual bags.",
  INVALID_BATCH_STATUS: "This batch cannot be updated yet.",
  EMPTY_BATCH: "Add at least one laundry order to the batch.",
  ORDER_NOT_ELIGIBLE: "This laundry is not eligible for the batch.",
  DELIVERY_BATCH_NOT_FOUND: "Delivery batch was not found.",
  DELIVERY_BATCH_NOT_ASSIGNED: "This delivery batch is not assigned to you.",
  DELIVERY_ATTEMPT_REASON_REQUIRED: "Please record why delivery could not be completed.",
};

const CODE_ALIASES: Record<string, string> = {
  BAG_ALREADY_HAS_ACTIVE_ORDER: "BAG_ALREADY_ACTIVE",
  BAG_OWNER_NOT_IN_PICKUP_HOSTEL: "WRONG_HOSTEL",
  PICKUP_SESSION_NOT_ACTIVE: "SESSION_NOT_ACTIVE",
  AUTHENTICATION_REQUIRED: "UNAUTHORIZED",
  ADMIN_ACCESS_REQUIRED: "FORBIDDEN",
  WASHING_STAFF_ACCESS_REQUIRED: "FORBIDDEN",
  ROLE_NOT_ALLOWED: "FORBIDDEN",
  ACTOR_MISMATCH: "FORBIDDEN",
  DELIVERY_BOY_NOT_ACTIVE: "FORBIDDEN",
  ACTOR_NOT_ACTIVE: "FORBIDDEN",
  BAG_NOT_FOUND: "NOT_FOUND",
  LAUNDRY_ORDER_NOT_FOUND: "NOT_FOUND",
  PICKUP_SESSION_NOT_FOUND: "NOT_FOUND",
  STUDENT_NOT_FOUND: "NOT_FOUND",
  WASHING_BATCH_NOT_FOUND: "NOT_FOUND",
  DELIVERY_BATCH_NOT_FOUND: "NOT_FOUND",
  WASHING_FACILITY_NOT_ASSIGNED: "FORBIDDEN",
  DELIVERY_BATCH_NOT_ASSIGNED: "ORDER_NOT_ASSIGNED",
  BATCH_NOT_RECEIVED: "BATCH_MISMATCH",
};

function extractErrorCode(raw: string): string | null {
  const match = raw.match(/\b([A-Z][A-Z0-9_]+)\b/);
  return match?.[1] ?? null;
}

export function getErrorMessage(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? "Something went wrong. Please try again.";
}

export function fromZodError(error: {
  issues: Array<{ message: string }>;
}): AppError {
  return {
    code: "VALIDATION_ERROR",
    message: error.issues[0]?.message ?? getErrorMessage("VALIDATION_ERROR"),
  };
}

export function toAppError(input: unknown, fallbackCode = "UNKNOWN"): AppError {
  const raw =
    typeof input === "string"
      ? input
      : input instanceof Error
        ? input.message
        : input &&
            typeof input === "object" &&
            "message" in input &&
            typeof input.message === "string"
          ? input.message
          : "";

  const extracted = extractErrorCode(raw) ?? fallbackCode;
  const code = CODE_ALIASES[extracted] ?? extracted;

  return {
    code,
    message: getErrorMessage(extracted, raw || undefined),
  };
}
