"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  retryDeliveryAction,
  type RetryDeliveryState,
} from "./retry-action";

const initialState: RetryDeliveryState = {
  success: false,
  message: "",
};

export function RetryDeliveryButton({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(
    retryDeliveryAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Updating..." : "Retry delivery"}
      </Button>
      {state.message ? (
        <p
          className={
            state.success ? "text-sm text-success" : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
