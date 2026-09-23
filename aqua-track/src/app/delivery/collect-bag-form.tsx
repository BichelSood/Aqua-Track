"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collectBagAction, type CollectBagState } from "./actions";

const initialState: CollectBagState = {
  success: false,
  message: "",
};

type CollectBagFormProps = {
  pickupSessionId: string;
};

export function CollectBagForm({
  pickupSessionId,
}: CollectBagFormProps) {
  const [state, formAction, pending] = useActionState(
    collectBagAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="hidden"
        name="pickupSessionId"
        value={pickupSessionId}
      />

      <div className="space-y-2">
        <label
          htmlFor={`bag-code-${pickupSessionId}`}
          className="text-sm font-medium"
        >
          Bag Code
        </label>

        <Input
          id={`bag-code-${pickupSessionId}`}
          name="bagCode"
          placeholder="e.g. BAG-TEST-002"
          autoComplete="off"
          required
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Collecting..." : "Collect Bag"}
      </Button>

      {state.message ? (
        <p
          className={
            state.success
              ? "text-sm text-green-600"
              : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}