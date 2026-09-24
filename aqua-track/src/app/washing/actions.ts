"use server";

import { revalidatePath } from "next/cache";
import { fromZodError } from "@/lib/errors";
import { washingTransitionSchema } from "@/lib/validation/schemas";
import {
  transitionOrderStatus,
  transitionSuccessMessage,
} from "@/services/laundry.service";

export type TransitionState = {
  success: boolean;
  message: string;
};

export async function transitionLaundryStatus(
  _previousState: TransitionState,
  formData: FormData,
): Promise<TransitionState> {
  const parsed = washingTransitionSchema.safeParse({
    orderId: String(formData.get("orderId") ?? ""),
    targetStatus: String(formData.get("toStatus") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
    };
  }

  const result = await transitionOrderStatus(parsed.data);

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  revalidatePath("/washing");
  revalidatePath("/student");
  revalidatePath("/delivery");

  return {
    success: true,
    message: transitionSuccessMessage(result.data.status),
  };
}
