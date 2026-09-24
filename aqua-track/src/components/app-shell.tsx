import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/app-header";

export function AppShell({
  name,
  roleLabel,
  sidebar,
  bottomNav,
  children,
  wide = false,
}: {
  name: string;
  roleLabel: string;
  sidebar: ReactNode;
  bottomNav: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen">
      <div
        className={cn(
          "mx-auto flex min-h-screen gap-4 px-3 py-4 md:px-6",
          wide ? "max-w-7xl" : "max-w-6xl",
        )}
      >
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col pb-24 md:pb-4">
          <AppHeader name={name} roleLabel={roleLabel} />
          <div className="page-enter mt-6 flex-1">{children}</div>
        </div>
      </div>
      {bottomNav}
    </div>
  );
}
