"use server";

import { revalidatePath } from "next/cache";
import { fromZodError } from "@/lib/errors";
import { deliveryTransitionSchema } from "@/lib/validation/schemas";
import {
  transitionDeliveryOrderStatus,
  transitionSuccessMessage,
} from "@/services/delivery.service";

export type DeliveryTransitionState = {
  success: boolean;
  message: string;
};

export async function transitionDeliveryStatus(
  _previousState: DeliveryTransitionState,
  formData: FormData,
): Promise<DeliveryTransitionState> {
  const parsed = deliveryTransitionSchema.safeParse({
    orderId: String(formData.get("orderId") ?? ""),
    targetStatus: String(formData.get("toStatus") ?? ""),
    reason: String(formData.get("reason") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
    };
  }

  const result = await transitionDeliveryOrderStatus(parsed.data);

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  revalidatePath("/delivery");
  revalidatePath("/student");

  return {
    success: true,
    message: transitionSuccessMessage(result.data.status),
  };
}
