import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { AUTH_LOGIN_PATH, getRoleHomePath } from "@/lib/auth/routes";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (!profile?.is_active) {
    redirect(AUTH_LOGIN_PATH);
  }

  redirect(getRoleHomePath(profile.role));
}
