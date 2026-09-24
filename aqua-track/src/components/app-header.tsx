import { LogoutButton } from "@/components/logout-button";
import { Greeting } from "@/components/greeting";

export function AppHeader({
  name,
  roleLabel,
}: {
  name: string;
  roleLabel: string;
}) {
  return (
    <header className="glass-panel flex flex-col gap-4 rounded-[1.25rem] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.22em] text-highlight uppercase">
          Aqua Track · {roleLabel}
        </p>
        <Greeting name={name} />
      </div>
      <LogoutButton />
    </header>
  );
}
