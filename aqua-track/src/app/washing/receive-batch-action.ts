"use server";

import { revalidatePath } from "next/cache";
import { fromZodError } from "@/lib/errors";
import { receiveWashingBatchSchema } from "@/lib/validation/schemas";
import { receiveWashingBatch } from "@/services/washing.service";

export type ReceiveBatchState = {
  success: boolean;
  message: string;
};

export async function receiveWashingBatchAction(
  _previousState: ReceiveBatchState,
  formData: FormData,
): Promise<ReceiveBatchState> {
  const parsed = receiveWashingBatchSchema.safeParse({
    washingBatchId: String(formData.get("washingBatchId") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
    };
  }

  const result = await receiveWashingBatch(parsed.data.washingBatchId);

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  revalidatePath("/washing");
  revalidatePath("/washing/dashboard");
  revalidatePath("/washing/batches");
  revalidatePath("/washing/queue");
  revalidatePath("/dashboard");
  revalidatePath("/delivery");

  return {
    success: true,
    message: "Washing batch received. Orders are now at the facility.",
  };
}
