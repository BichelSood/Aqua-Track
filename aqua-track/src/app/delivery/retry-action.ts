"use server";

import { revalidatePath } from "next/cache";
import { retryDelivery } from "@/services/delivery.service";

export type RetryDeliveryState = {
  success: boolean;
  message: string;
};

export async function retryDeliveryAction(
  _previousState: RetryDeliveryState,
  formData: FormData,
): Promise<RetryDeliveryState> {
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    return { success: false, message: "Laundry order is required." };
  }

  const result = await retryDelivery(orderId);

  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidatePath("/delivery/deliveries");
  revalidatePath("/delivery/dashboard");
  revalidatePath("/laundry");

  return { success: true, message: "Delivery can be tried again." };
}
