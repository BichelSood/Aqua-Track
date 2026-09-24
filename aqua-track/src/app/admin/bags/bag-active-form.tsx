"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateBagAction, type AdminFormState } from "../actions";

const initialState: AdminFormState = { success: false, message: "" };

export function BagActiveForm({
  bagId,
  isActive,
}: {
  bagId: string;
  isActive: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateBagAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="bagId" value={bagId} />
      <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "..." : isActive ? "Deactivate" : "Activate"}
      </Button>
      {state.message && !state.success ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}
