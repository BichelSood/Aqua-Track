"use server";

import { fromZodError } from "@/lib/errors";
import { laundryLookupSchema } from "@/lib/validation/schemas";
import { findLaundryByIdentifier } from "@/services/washing.service";
import type { LaundryStatus } from "@/types";

export type LaundryLookupState = {
  success: boolean;
  message: string;
  order?: {
    id: string;
    order_number: string;
    status: LaundryStatus;
    bag_code: string;
    student_name: string;
    roll_number: string | null;
    room_number: string | null;
  };
};

export async function lookupLaundry(
  _previousState: LaundryLookupState,
  formData: FormData,
): Promise<LaundryLookupState> {
  const parsed = laundryLookupSchema.safeParse({
    identifier: String(formData.get("identifier") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
    };
  }

  const result = await findLaundryByIdentifier(parsed.data.identifier);

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  return {
    success: true,
    message: "Laundry order found.",
    order: {
      id: result.data.id,
      order_number: result.data.orderNumber,
      status: result.data.status,
      bag_code: result.data.bagCode,
      student_name: result.data.studentName,
      roll_number: result.data.rollNumber,
      room_number: result.data.roomNumber,
    },
  };
}
