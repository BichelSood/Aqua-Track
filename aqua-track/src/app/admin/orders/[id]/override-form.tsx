"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { getLaundryStatusLabel } from "@/lib/labels";
import { LAUNDRY_STATUSES } from "@/types";
import { overrideOrderAction, type AdminFormState } from "../../actions";

const initialState: AdminFormState = { success: false, message: "" };

export function OverrideForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [state, formAction, pending] = useActionState(
    overrideOrderAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-sm">
        Current status: {getLaundryStatusLabel(currentStatus)}
      </p>
      <div className="space-y-2">
        <label htmlFor="targetStatus" className="text-sm font-medium">
          Corrected status
        </label>
        <select
          id="targetStatus"
          name="targetStatus"
          required
          className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
          defaultValue={currentStatus}
        >
          {LAUNDRY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {getLaundryStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="reason" className="text-sm font-medium">
          Reason
        </label>
        <textarea
          id="reason"
          name="reason"
          required
          rows={3}
          className="w-full rounded-md border bg-transparent px-2.5 py-2 text-sm"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Apply correction"}
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
