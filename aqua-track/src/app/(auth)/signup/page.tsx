import Link from "next/link";
import { signup } from "./actions";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Create your Aqua Track account
          </h1>

          <p className="text-sm text-muted-foreground">
            Sign up to track your laundry from pickup to delivery.
          </p>
        </div>

        <form action={signup} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full name
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full rounded-md border px-3 py-2"
              placeholder="Your phone number"
            />
          </div>

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
              minLength={8}
              className="w-full rounded-md border px-3 py-2"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}