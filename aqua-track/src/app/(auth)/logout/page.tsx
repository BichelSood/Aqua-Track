import { Button } from "@/components/ui/button";
import { logout } from "./actions";

export default function LogoutPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <form action={logout}>
        <Button type="submit">Log out</Button>
      </form>
    </main>
  );
}