import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  switch (profile.role) {
    case "STUDENT":
      redirect("/student");

    case "DELIVERY_BOY":
      redirect("/delivery");

    case "WASHING_STAFF":
      redirect("/washing");

    case "ADMIN":
      redirect("/admin");

    default:
      redirect("/login");
  }
}