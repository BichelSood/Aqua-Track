"use server";

import { collectBag } from "@/services/pickup.service";
import { fromZodError } from "@/lib/errors";
import { scanBagSchema } from "@/lib/validation/schemas";

export type CollectBagState = {
  success: boolean;
  message: string;
};

export async function collectBagAction(
  _previousState: CollectBagState,
  formData: FormData,
): Promise<CollectBagState> {
  const parsed = scanBagSchema.safeParse({
    identifier: String(formData.get("identifier") ?? ""),
    pickupSessionId: String(formData.get("pickupSessionId") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
    };
  }

  const result = await collectBag(parsed.data);

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  return {
    success: true,
    message: `Bag collected successfully. Order: ${result.data.orderNumber}`,
  };
}
