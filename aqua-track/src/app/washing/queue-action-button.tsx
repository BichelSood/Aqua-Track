"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  markWashedAction,
  startWashingAction,
  type QueueActionState,
} from "./queue-actions";

const initialState: QueueActionState = {
  success: false,
  message: "",
};

export function QueueActionButton({
  orderId,
  action,
}: {
  orderId: string;
  action: "START" | "COMPLETE";
}) {
  const [state, formAction, pending] = useActionState(
    action === "START" ? startWashingAction : markWashedAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" disabled={pending}>
        {pending
          ? "Updating..."
          : action === "START"
            ? "Start washing"
            : "Mark washed"}
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
