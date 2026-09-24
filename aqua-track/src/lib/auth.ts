import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export type AuthProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  hostel_id: string | null;
  facility_id: string | null;
  room_number: string | null;
  avatar_url: string | null;
  is_active: boolean;
  roll_number: string | null;
  created_at: string;
  updated_at: string;
};

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

export async function getCurrentProfile(): Promise<AuthProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, role, hostel_id, facility_id, room_number, avatar_url, is_active, roll_number, created_at, updated_at",
    )
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile as AuthProfile;
}
