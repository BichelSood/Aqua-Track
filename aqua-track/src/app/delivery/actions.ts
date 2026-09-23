"use server";

import { collectBag } from "@/lib/operations/pickup";

export type CollectBagState = {
  success: boolean;
  message: string;
};

export async function collectBagAction(
  _previousState: CollectBagState,
  formData: FormData,
): Promise<CollectBagState> {
  const bagCode = String(formData.get("bagCode") ?? "").trim();
  const pickupSessionId = String(
    formData.get("pickupSessionId") ?? "",
  ).trim();

  if (!bagCode) {
    return {
      success: false,
      message: "Please enter a bag code.",
    };
  }

  if (!pickupSessionId) {
    return {
      success: false,
      message: "Pickup session is required.",
    };
  }

  const result = await collectBag(bagCode, pickupSessionId);

  if (!result.success) {
    return {
      success: false,
      message: result.error,
    };
  }

  return {
    success: true,
    message: `Bag collected successfully. Order: ${result.orderNumber}`,
  };
}