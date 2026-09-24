"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  updateFacilityAction,
  updateHostelAction,
  type AdminFormState,
} from "../actions";

const initialState: AdminFormState = { success: false, message: "" };

export function LocationActiveForm({
  kind,
  location,
}: {
  kind: "hostel" | "facility";
  location: {
    id: string;
    name: string;
    code: string;
    address: string | null;
    is_active: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(
    kind === "hostel" ? updateHostelAction : updateFacilityAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="id" value={location.id} />
      <input type="hidden" name="name" value={location.name} />
      <input type="hidden" name="code" value={location.code} />
      <input type="hidden" name="address" value={location.address ?? ""} />
      <input
        type="hidden"
        name="isActive"
        value={location.is_active ? "false" : "true"}
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "..." : location.is_active ? "Deactivate" : "Activate"}
      </Button>
      {state.message && !state.success ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}
