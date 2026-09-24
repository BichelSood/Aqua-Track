"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createFacilityAction,
  createHostelAction,
  type AdminFormState,
} from "../actions";

const initialState: AdminFormState = { success: false, message: "" };

export function LocationCreateForm({ kind }: { kind: "hostel" | "facility" }) {
  const [state, formAction, pending] = useActionState(
    kind === "hostel" ? createHostelAction : createFacilityAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
      <Input name="name" required placeholder="Name" />
      <Input name="code" required placeholder="Code" />
      <Input name="address" placeholder="Address" />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : kind === "hostel" ? "Add hostel" : "Add facility"}
      </Button>
      {state.message ? (
        <p
          className={
            state.success
              ? "text-sm text-success md:col-span-4"
              : "text-sm text-destructive md:col-span-4"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
