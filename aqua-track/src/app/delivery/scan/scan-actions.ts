"use server";

import { revalidatePath } from "next/cache";
import { fromZodError } from "@/lib/errors";
import {
  recordDeliveryAttemptSchema,
  scannerIdentifierSchema,
} from "@/lib/validation/schemas";
import {
  confirmUniversalScan,
  recordDeliveryAttempt,
  resolveUniversalScan,
} from "@/services/delivery.service";
import type { ScannerResult } from "@/lib/scanner";

export type ScanActionState = {
  success: boolean;
  message: string;
  result: ScannerResult | null;
};

function revalidateDeliveryRoutes() {
  revalidatePath("/delivery");
  revalidatePath("/delivery/dashboard");
  revalidatePath("/delivery/pickups");
  revalidatePath("/delivery/deliveries");
  revalidatePath("/delivery/scan");
  revalidatePath("/dashboard");
  revalidatePath("/laundry");
  revalidatePath("/washing");
}

export async function resolveScanAction(
  identifier: string,
): Promise<ScanActionState> {
  const parsed = scannerIdentifierSchema.safeParse({ identifier });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
      result: null,
    };
  }

  const result = await resolveUniversalScan(parsed.data.identifier);

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
      result: null,
    };
  }

  return {
    success: result.data.success,
    message: result.data.message,
    result: result.data,
  };
}

export async function confirmScanAction(
  identifier: string,
): Promise<ScanActionState> {
  const parsed = scannerIdentifierSchema.safeParse({ identifier });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
      result: null,
    };
  }

  const result = await confirmUniversalScan(parsed.data.identifier);

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
      result: null,
    };
  }

  revalidateDeliveryRoutes();

  return {
    success: result.data.success,
    message: result.data.message,
    result: result.data,
  };
}

export async function recordAttemptAction(
  identifier: string,
  reason: string,
): Promise<ScanActionState> {
  const parsed = recordDeliveryAttemptSchema.safeParse({ identifier, reason });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
      result: null,
    };
  }

  const result = await recordDeliveryAttempt(parsed.data);

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
      result: null,
    };
  }

  revalidateDeliveryRoutes();

  return {
    success: result.data.success,
    message: result.data.message,
    result: result.data,
  };
}
