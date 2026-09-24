"use server";

import { revalidatePath } from "next/cache";
import { fromZodError } from "@/lib/errors";
import { pickupSessionActionSchema } from "@/lib/validation/schemas";
import {
  completePickupSession,
  startPickupSession,
} from "@/services/pickup.service";

export type PickupSessionActionState = {
  success: boolean;
  message: string;
};

export async function pickupSessionAction(
  _previousState: PickupSessionActionState,
  formData: FormData,
): Promise<PickupSessionActionState> {
  const parsed = pickupSessionActionSchema.safeParse({
    pickupSessionId: String(formData.get("pickupSessionId") ?? ""),
    action: String(formData.get("action") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
    };
  }

  const result =
    parsed.data.action === "START"
      ? await startPickupSession(parsed.data.pickupSessionId)
      : await completePickupSession(parsed.data.pickupSessionId);

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  revalidatePath("/delivery");
  revalidatePath("/delivery/dashboard");
  revalidatePath("/delivery/pickups");
  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return {
    success: true,
    message:
      parsed.data.action === "START"
        ? "Pickup session started successfully."
        : "Pickup session completed successfully.",
  };
}
