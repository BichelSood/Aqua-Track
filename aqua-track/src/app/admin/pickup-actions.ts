"use server";

import { revalidatePath } from "next/cache";
import { fromZodError } from "@/lib/errors";
import { createPickupSessionSchema } from "@/lib/validation/schemas";
import { createPickupSession as createPickupSessionRecord } from "@/services/pickup.service";

export type CreatePickupSessionState = {
  success: boolean;
  message: string;
};

export async function createPickupSession(
  _previousState: CreatePickupSessionState,
  formData: FormData,
): Promise<CreatePickupSessionState> {
  const parsed = createPickupSessionSchema.safeParse({
    hostelId: String(formData.get("hostelId") ?? ""),
    deliveryBoyId: String(formData.get("deliveryBoyId") ?? ""),
    scheduledDate: String(formData.get("scheduledDate") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
    };
  }

  const result = await createPickupSessionRecord(parsed.data);

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  revalidatePath("/delivery");

  return {
    success: true,
    message: "Pickup session created successfully.",
  };
}
