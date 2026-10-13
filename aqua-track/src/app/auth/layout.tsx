import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="glass-panel w-full max-w-md space-y-8 rounded-[1.5rem] p-8">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          ← Back to home
        </Link>
        {children}
      </div>
    </main>
  );
}
