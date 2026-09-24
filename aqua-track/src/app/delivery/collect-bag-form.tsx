"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRScanner } from "@/components/qr-scanner";
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

  const [identifier, setIdentifier] = useState("");

  function handleScan(value: string) {
    setIdentifier(value);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="hidden"
        name="pickupSessionId"
        value={pickupSessionId}
      />

      <QRScanner onScan={handleScan} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-sm text-muted-foreground">
            OR
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`identifier-${pickupSessionId}`}
          className="text-sm font-medium"
        >
          Roll Number
        </label>

        <Input
          id={`identifier-${pickupSessionId}`}
          name="identifier"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Enter student roll number"
          autoComplete="off"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={pending || !identifier.trim()}
        className="w-full"
      >
        {pending ? "Collecting..." : "Collect Laundry"}
      </Button>

      {state.message ? (
        <p
          className={
            state.success
              ? "text-sm text-success"
              : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}