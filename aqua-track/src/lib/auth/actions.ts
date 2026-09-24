"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUTH_LOGIN_PATH } from "@/lib/auth/routes";

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(AUTH_LOGIN_PATH);
}
