"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { COMPLAINT_TYPES } from "@/types";
import { getComplaintTypeLabel } from "@/lib/labels";
import { createComplaintAction, type StudentFormState } from "../actions";

const initialState: StudentFormState = {
  success: false,
  message: "",
};

export function ComplaintForm({
  orders,
  defaultOrderId,
}: {
  orders: { id: string; order_number: string }[];
  defaultOrderId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createComplaintAction,
    initialState,
  );

  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You need a laundry order before you can report a problem.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <label htmlFor="laundryOrderId" className="text-sm font-medium">
          Laundry order
        </label>
        <select
          id="laundryOrderId"
          name="laundryOrderId"
          required
          defaultValue={defaultOrderId ?? orders[0]?.id}
          className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm"
        >
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.order_number}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          Type
        </label>
        <select
          id="type"
          name="type"
          required
          className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm"
        >
          {COMPLAINT_TYPES.map((type) => (
            <option key={type} value={type}>
              {getComplaintTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          className="w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit complaint"}
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
