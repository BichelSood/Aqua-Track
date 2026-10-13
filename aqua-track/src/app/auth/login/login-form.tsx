"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DemoCredentials } from "@/config/demo-credentials";
import { AUTH_FORGOT_PASSWORD_PATH, AUTH_SIGNUP_PATH } from "@/lib/auth/routes";
import { loginAction, type AuthFormState } from "../actions";

const initialState: AuthFormState = {
  success: false,
  message: "",
};

export function LoginForm({
  errorCode,
  demoCredentials,
}: {
  errorCode?: string;
  demoCredentials?: DemoCredentials | null;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  const inactiveMessage =
    errorCode === "inactive"
      ? "This account is not active. Contact an administrator."
      : errorCode === "auth"
        ? "The sign-in link is invalid or has expired."
        : "";

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
          defaultValue={demoCredentials?.email}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Your password"
          defaultValue={demoCredentials?.password}
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Log in"}
      </Button>

      {inactiveMessage || state.message ? (
        <p
          className={
            state.success
              ? "text-sm text-success"
              : "text-sm text-destructive"
          }
        >
          {state.message || inactiveMessage}
        </p>
      ) : null}

      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>
          <Link
            href={AUTH_FORGOT_PASSWORD_PATH}
            className="font-medium text-foreground underline"
          >
            Forgot your password?
          </Link>
        </p>
        <p>
          Do not have an account?{" "}
          <Link
            href={AUTH_SIGNUP_PATH}
            className="font-medium text-foreground underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </form>
  );
}
