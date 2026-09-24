import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { AUTH_LOGIN_PATH, getRoleHomePath } from "@/lib/auth/routes";
import type { UserRole } from "@/types";

export async function requireAuth() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(AUTH_LOGIN_PATH);
  }

  if (!profile.is_active) {
    redirect(`${AUTH_LOGIN_PATH}?error=inactive`);
  }

  return profile;
}

export async function requireRole(role: UserRole) {
  const profile = await requireAuth();

  if (profile.role !== role) {
    redirect(getRoleHomePath(profile.role));
  }

  return profile;
}
