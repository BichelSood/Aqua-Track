"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBagAction, type AdminFormState } from "../actions";

const initialState: AdminFormState = { success: false, message: "" };

export function CreateBagForm({
  students,
}: {
  students: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    createBagAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-lg border p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="ownerId" className="text-sm font-medium">
            Student
          </label>
          <select
            id="ownerId"
            name="ownerId"
            required
            className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Choose a student
            </option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="bagCode" className="text-sm font-medium">
            Bag code
          </label>
          <Input id="bagCode" name="bagCode" required placeholder="BAG-AQ-..." />
        </div>
      </div>
      <Button type="submit" disabled={pending || students.length === 0}>
        {pending ? "Saving..." : "Register bag"}
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
