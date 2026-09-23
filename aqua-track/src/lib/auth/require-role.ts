import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

type UserRole = "STUDENT" | "DELIVERY_BOY" | "WASHING_STAFF" | "ADMIN";

export async function requireRole(role: UserRole) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== role) {
    redirect("/");
  }

  if (!profile.is_active) {
    redirect("/login");
  }

  return profile;
}