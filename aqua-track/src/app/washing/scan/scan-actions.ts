"use server";

import { revalidatePath } from "next/cache";
import { fromZodError } from "@/lib/errors";
import { scannerIdentifierSchema } from "@/lib/validation/schemas";
import {
  confirmWashingScan,
  resolveWashingScan,
} from "@/services/washing.service";
import type { ScannerResult } from "@/lib/scanner";

export type WashingScanState = {
  success: boolean;
  message: string;
  result: ScannerResult | null;
};

function revalidateWashingRoutes() {
  revalidatePath("/washing");
  revalidatePath("/washing/dashboard");
  revalidatePath("/washing/queue");
  revalidatePath("/washing/scan");
  revalidatePath("/dashboard");
  revalidatePath("/laundry");
}

export async function resolveWashingScanAction(
  identifier: string,
): Promise<WashingScanState> {
  const parsed = scannerIdentifierSchema.safeParse({ identifier });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
      result: null,
    };
  }

  const result = await resolveWashingScan(parsed.data.identifier);

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

export async function confirmWashingScanAction(
  identifier: string,
): Promise<WashingScanState> {
  const parsed = scannerIdentifierSchema.safeParse({ identifier });

  if (!parsed.success) {
    return {
      success: false,
      message: fromZodError(parsed.error).message,
      result: null,
    };
  }

  const result = await confirmWashingScan(parsed.data.identifier);

  if (!result.success) {
    return {
      success: false,
      message: result.error.message,
      result: null,
    };
  }

  revalidateWashingRoutes();

  return {
    success: result.data.success,
    message: result.data.message,
    result: result.data,
  };
}
