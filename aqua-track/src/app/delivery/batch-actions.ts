"use server";

import { revalidatePath } from "next/cache";
import { fromZodError } from "@/lib/errors";
import {
  createDeliveryBatchSchema,
  deliveryBatchIdSchema,
} from "@/lib/validation/schemas";
import {
  createDeliveryBatch,
  markDeliveryBatchReady,
  startDeliveryBatch,
} from "@/services/delivery.service";

export type DeliveryBatchState = {
  success: boolean;
  message: string;
};

function revalidateDelivery() {
  revalidatePath("/delivery");
  revalidatePath("/delivery/dashboard");
  revalidatePath("/delivery/deliveries");
  revalidatePath("/delivery/pickups");
  revalidatePath("/washing");
  revalidatePath("/dashboard");
}

export async function createDeliveryBatchAction(
  _previousState: DeliveryBatchState,
  formData: FormData,
): Promise<DeliveryBatchState> {
  const orderIds = formData
    .getAll("orderIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const parsed = createDeliveryBatchSchema.safeParse({
    hostelId: String(formData.get("hostelId") ?? ""),
    orderIds,
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await createDeliveryBatch(parsed.data);

  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateDelivery();

  return { success: true, message: "Delivery batch created." };
}

export async function markDeliveryBatchReadyAction(
  _previousState: DeliveryBatchState,
  formData: FormData,
): Promise<DeliveryBatchState> {
  const parsed = deliveryBatchIdSchema.safeParse({
    deliveryBatchId: String(formData.get("deliveryBatchId") ?? ""),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await markDeliveryBatchReady(parsed.data.deliveryBatchId);

  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateDelivery();

  return { success: true, message: "Delivery batch is ready." };
}

export async function startDeliveryBatchAction(
  _previousState: DeliveryBatchState,
  formData: FormData,
): Promise<DeliveryBatchState> {
  const parsed = deliveryBatchIdSchema.safeParse({
    deliveryBatchId: String(formData.get("deliveryBatchId") ?? ""),
  });

  if (!parsed.success) {
    return { success: false, message: fromZodError(parsed.error).message };
  }

  const result = await startDeliveryBatch(parsed.data.deliveryBatchId);

  if (!result.success) {
    return { success: false, message: result.error.message };
  }

  revalidateDelivery();

  return { success: true, message: "Delivery batch is out for delivery." };
}
