"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_LOGIN_PATH } from "@/lib/auth/routes";
import { forgotPasswordAction, type AuthFormState } from "../actions";

const initialState: AuthFormState = {
  success: false,
  message: "",
};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending..." : "Send reset link"}
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

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={AUTH_LOGIN_PATH}
          className="font-medium text-foreground underline"
        >
          Back to log in
        </Link>
      </p>
    </form>
  );
}
