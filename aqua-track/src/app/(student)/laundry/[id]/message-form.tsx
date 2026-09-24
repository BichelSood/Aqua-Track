"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { sendMessageAction, type StudentFormState } from "../../actions";

const initialState: StudentFormState = {
  success: false,
  message: "",
};

export function MessageForm({
  laundryOrderId,
  receiverId,
}: {
  laundryOrderId: string;
  receiverId: string;
}) {
  const [state, formAction, pending] = useActionState(
    sendMessageAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="laundryOrderId" value={laundryOrderId} />
      <input type="hidden" name="receiverId" value={receiverId} />
      <label htmlFor="message" className="text-sm font-medium">
        Message delivery staff
      </label>
      <textarea
        id="message"
        name="message"
        required
        rows={3}
        className="w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send message"}
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
