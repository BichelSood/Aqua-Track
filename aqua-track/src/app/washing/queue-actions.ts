"use server";

import { revalidatePath } from "next/cache";
import { markWashed, startWashing } from "@/services/washing.service";

export type QueueActionState = {
  success: boolean;
  message: string;
};

function revalidateWashingRoutes() {
  revalidatePath("/washing");
  revalidatePath("/washing/dashboard");
  revalidatePath("/washing/batches");
  revalidatePath("/washing/queue");
  revalidatePath("/washing/scan");
  revalidatePath("/dashboard");
  revalidatePath("/laundry");
  revalidatePath("/delivery");
}

export async function startWashingAction(
  _previousState: QueueActionState,
  formData: FormData,
): Promise<QueueActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) {
    return { success: false, message: "Laundry order is required." };
  }

  const result = await startWashing(orderId);
  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateWashingRoutes();
  return { success: true, message: "Washing started." };
}

export async function markWashedAction(
  _previousState: QueueActionState,
  formData: FormData,
): Promise<QueueActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) {
    return { success: false, message: "Laundry order is required." };
  }

  const result = await markWashed(orderId);
  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateWashingRoutes();
  return { success: true, message: "Marked ready for delivery." };
}
