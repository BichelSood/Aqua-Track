"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPickupSession,
  type CreatePickupSessionState,
} from "./pickup-actions";

type Hostel = {
  id: string;
  name: string;
  code: string;
};

type DeliveryBoy = {
  id: string;
  full_name: string;
};

type CreatePickupFormProps = {
  hostels: Hostel[];
  deliveryBoys: DeliveryBoy[];
};

const initialState: CreatePickupSessionState = {
  success: false,
  message: "",
};

export function CreatePickupForm({
  hostels,
  deliveryBoys,
}: CreatePickupFormProps) {
  const [state, formAction, pending] = useActionState(
    createPickupSession,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="hostelId"
          className="text-sm font-medium"
        >
          Hostel
        </label>

        <select
          id="hostelId"
          name="hostelId"
          required
          className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            Select a hostel
          </option>

          {hostels.map((hostel) => (
            <option key={hostel.id} value={hostel.id}>
              {hostel.name} ({hostel.code})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="deliveryBoyId"
          className="text-sm font-medium"
        >
          Delivery Staff
        </label>

        <select
          id="deliveryBoyId"
          name="deliveryBoyId"
          required
          className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            Select delivery staff
          </option>

          {deliveryBoys.map((deliveryBoy) => (
            <option
              key={deliveryBoy.id}
              value={deliveryBoy.id}
            >
              {deliveryBoy.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="scheduledDate"
          className="text-sm font-medium"
        >
          Pickup Date
        </label>

        <Input
          id="scheduledDate"
          name="scheduledDate"
          type="date"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="startTime"
            className="text-sm font-medium"
          >
            Start Time
          </label>

          <Input
            id="startTime"
            name="startTime"
            type="time"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="endTime"
            className="text-sm font-medium"
          >
            End Time
          </label>

          <Input
            id="endTime"
            name="endTime"
            type="time"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full"
      >
        {pending ? "Creating..." : "Create Pickup Session"}
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