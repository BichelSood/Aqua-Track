import Link from "next/link";
import { login } from "./actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back
          </h1>

          <p className="text-sm text-muted-foreground">
            Log in to track your laundry.
          </p>
        </div>

        <form action={login} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Log in
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}