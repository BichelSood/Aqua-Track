"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  transitionLaundryStatus,
  type TransitionState,
} from "./actions";

const initialState: TransitionState = {
  success: false,
  message: "",
};

type TransitionButtonProps = {
  orderId: string;
  toStatus: string;
  label: string;
};

export function TransitionButton({
  orderId,
  toStatus,
  label,
}: TransitionButtonProps) {
  const [state, formAction, pending] = useActionState(
    transitionLaundryStatus,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="toStatus" value={toStatus} />

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