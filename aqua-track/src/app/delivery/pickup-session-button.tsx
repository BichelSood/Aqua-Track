"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  pickupSessionAction,
  type PickupSessionActionState,
} from "./pickup-session-action";

const initialState: PickupSessionActionState = {
  success: false,
  message: "",
};

type PickupSessionButtonProps = {
  pickupSessionId: string;
  action: "START" | "COMPLETE";
};

export function PickupSessionButton({
  pickupSessionId,
  action,
}: PickupSessionButtonProps) {
  const [state, formAction, pending] = useActionState(
    pickupSessionAction,
    initialState,
  );

  const isStart = action === "START";

  return (
    <form action={formAction} className="space-y-2">
      <input
        type="hidden"
        name="pickupSessionId"
        value={pickupSessionId}
      />

      <input type="hidden" name="action" value={action} />

      <Button type="submit" disabled={pending}>
        {pending
          ? isStart
            ? "Starting..."
            : "Completing..."
          : isStart
            ? "Start Pickup"
            : "Complete Pickup"}
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