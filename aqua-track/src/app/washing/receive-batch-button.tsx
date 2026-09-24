"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  receiveWashingBatchAction,
  type ReceiveBatchState,
} from "./receive-batch-action";

const initialState: ReceiveBatchState = {
  success: false,
  message: "",
};

export function ReceiveBatchButton({
  washingBatchId,
}: {
  washingBatchId: string;
}) {
  const [state, formAction, pending] = useActionState(
    receiveWashingBatchAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="washingBatchId" value={washingBatchId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Receiving..." : "Receive Batch"}
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
