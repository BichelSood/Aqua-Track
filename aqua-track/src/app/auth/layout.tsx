import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="glass-panel w-full max-w-md space-y-8 rounded-[1.5rem] p-8">
        {children}
      </div>
    </main>
  );
}
