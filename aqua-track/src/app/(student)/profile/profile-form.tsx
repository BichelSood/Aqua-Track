"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction, type StudentFormState } from "../actions";

const initialState: StudentFormState = {
  success: false,
  message: "",
};

export function ProfileForm({
  fullName,
  phone,
  roomNumber,
}: {
  fullName: string;
  phone: string | null;
  roomNumber: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full name
        </label>
        <Input
          id="fullName"
          name="fullName"
          required
          defaultValue={fullName}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <Input id="phone" name="phone" defaultValue={phone ?? ""} />
      </div>
      <div className="space-y-2">
        <label htmlFor="roomNumber" className="text-sm font-medium">
          Room number
        </label>
        <Input
          id="roomNumber"
          name="roomNumber"
          defaultValue={roomNumber ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
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
