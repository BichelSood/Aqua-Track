"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createDeliveryBatchAction,
  markDeliveryBatchReadyAction,
  startDeliveryBatchAction,
  type DeliveryBatchState,
} from "./batch-actions";

const initialState: DeliveryBatchState = {
  success: false,
  message: "",
};

export function CreateDeliveryBatchButton({
  hostelId,
  orderIds,
}: {
  hostelId: string;
  orderIds: string[];
}) {
  const [state, formAction, pending] = useActionState(
    createDeliveryBatchAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="hostelId" value={hostelId} />
      {orderIds.map((orderId) => (
        <input key={orderId} type="hidden" name="orderIds" value={orderId} />
      ))}
      <Button type="submit" disabled={pending || orderIds.length === 0}>
        {pending ? "Creating..." : "Create Delivery Batch"}
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

export function DeliveryBatchLifecycleButton({
  deliveryBatchId,
  action,
}: {
  deliveryBatchId: string;
  action: "READY" | "START";
}) {
  const [state, formAction, pending] = useActionState(
    action === "READY"
      ? markDeliveryBatchReadyAction
      : startDeliveryBatchAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="deliveryBatchId" value={deliveryBatchId} />
      <Button type="submit" disabled={pending}>
        {pending
          ? "Updating..."
          : action === "READY"
            ? "Mark Ready"
            : "Start Delivery"}
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
