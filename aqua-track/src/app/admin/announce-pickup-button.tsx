"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  announcePickupSession,
  type AnnouncePickupState,
} from "./announce-pickup-action";

const initialState: AnnouncePickupState = {
  success: false,
  message: "",
};

type AnnouncePickupButtonProps = {
  pickupSessionId: string;
};

export function AnnouncePickupButton({
  pickupSessionId,
}: AnnouncePickupButtonProps) {
  const [state, formAction, pending] = useActionState(
    announcePickupSession,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <input
        type="hidden"
        name="pickupSessionId"
        value={pickupSessionId}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Announcing..." : "Announce Pickup"}
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
