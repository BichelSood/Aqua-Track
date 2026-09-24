"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { getComplaintStatusLabel } from "@/lib/labels";
import { COMPLAINT_STATUSES } from "@/types";
import { updateComplaintAction, type AdminFormState } from "../actions";

const initialState: AdminFormState = { success: false, message: "" };

export function ComplaintStatusForm({
  complaintId,
  status,
}: {
  complaintId: string;
  status: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateComplaintAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="complaintId" value={complaintId} />
      <select
        name="status"
        defaultValue={status}
        className="h-9 rounded-md border bg-transparent px-2 text-sm"
      >
        {COMPLAINT_STATUSES.map((item) => (
          <option key={item} value={item}>
            {getComplaintStatusLabel(item)}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Saving..." : "Update"}
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
