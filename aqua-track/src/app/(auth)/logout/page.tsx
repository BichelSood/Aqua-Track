import { LogoutButton } from "@/components/logout-button";

export default function LogoutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Log out of Aqua Track</h1>
      <LogoutButton />
    </main>
  );
}
