"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type StudentFormState,
} from "../actions";

const initialState: StudentFormState = {
  success: false,
  message: "",
};

export function NotificationActions({
  mode,
  notificationId,
}: {
  mode: "one" | "all";
  notificationId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    mode === "all"
      ? markAllNotificationsReadAction
      : markNotificationReadAction,
    initialState,
  );

  return (
    <form action={formAction}>
      {notificationId ? (
        <input type="hidden" name="notificationId" value={notificationId} />
      ) : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending
          ? "Updating..."
          : mode === "all"
            ? "Mark all as read"
            : "Mark as read"}
      </Button>
      {state.message && !state.success ? (
        <p className="mt-2 text-sm text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}