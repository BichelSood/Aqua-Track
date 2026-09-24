"use server";

import { revalidatePath } from "next/cache";
import { fromZodError } from "@/lib/errors";
import { announcePickupSessionSchema } from "@/lib/validation/schemas";
import { announcePickupSession as announcePickupSessionRecord } from "@/services/pickup.service";

export type AnnouncePickupState = {
  success: boolean;
  message: string;
};

export async function announcePickupSession(
  _previousState: AnnouncePickupState,
  formData: FormData,
): Promise<AnnouncePickupState> {
  const parsed = announcePickupSessionSchema.safeParse({
    pickupSessionId: String(formData.get("pickupSessionId") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
    };
  }

  const result = await announcePickupSessionRecord(parsed.data.pickupSessionId);

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
    message: "Pickup session announced successfully.",
  };
}
