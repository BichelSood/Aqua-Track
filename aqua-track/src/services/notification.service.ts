import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/lib/errors";
import type { AppResult } from "@/types";

export async function markNotificationRead(
  notificationId: string,
): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: toAppError("AUTHENTICATION_REQUIRED") };
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  return { success: true, data: { id: data.id } };
}

export async function markAllNotificationsRead(): Promise<AppResult<{ count: number }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: toAppError("AUTHENTICATION_REQUIRED") };
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)
    .select("id");

  if (error) {
    return { success: false, error: toAppError(error) };
  }

  return { success: true, data: { count: data?.length ?? 0 } };
}
