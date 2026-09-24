"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import {
  lookupLaundry,
  type LaundryLookupState,
} from "./lookup-action";

const initialState: LaundryLookupState = {
  success: false,
  message: "",
};

export function LaundryLookupForm() {
  const [state, formAction, pending] = useActionState(
    lookupLaundry,
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identify Laundry</CardTitle>
        <CardDescription>
          Scan the bag QR code or enter the student roll number.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="identifier"
              className="text-sm font-medium"
            >
              QR / Bag Code / Roll Number
            </label>

            <Input
              id="identifier"
              name="identifier"
              placeholder="Scan QR or enter roll number"
              autoComplete="off"
              required
            />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Finding..." : "Find Laundry"}
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

          {state.success && state.order ? (
            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Student
                </p>
                <p className="font-medium">
                  {state.order.student_name}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Roll Number
                  </p>
                  <p className="font-medium">
                    {state.order.roll_number ?? "Not assigned"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Room
                  </p>
                  <p className="font-medium">
                    {state.order.room_number ?? "Not assigned"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Bag
                  </p>
                  <p className="font-medium">
                    {state.order.bag_code}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Order
                  </p>
                  <p className="font-medium">
                    {state.order.order_number}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Current Status
                </p>
                <p className="font-medium">
                  <StatusBadge status={state.order.status} />
                </p>
              </div>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}