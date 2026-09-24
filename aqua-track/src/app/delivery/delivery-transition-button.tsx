"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  transitionDeliveryStatus,
  type DeliveryTransitionState,
} from "./transition-action";

const initialState: DeliveryTransitionState = {
  success: false,
  message: "",
};

type DeliveryTransitionButtonProps = {
  orderId: string;
  toStatus: string;
  label: string;
  reason?: string;
};

export function DeliveryTransitionButton({
  orderId,
  toStatus,
  label,
  reason,
}: DeliveryTransitionButtonProps) {
  const [state, formAction, pending] = useActionState(
    transitionDeliveryStatus,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="toStatus" value={toStatus} />
      {reason ? <input type="hidden" name="reason" value={reason} /> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Updating..." : label}
      </Button>

      {state.message ? (
        <p
          className={
            state.success
              ? "text-sm text-success"
              : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}