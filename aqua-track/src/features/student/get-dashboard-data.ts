import { createClient } from "@/lib/supabase/server";
import { ACTIVE_LAUNDRY_STATUSES } from "@/types";

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getStudentDashboardData(studentId: string) {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("hostel_id, hostels(name)")
    .eq("id", studentId)
    .single();

  if (profileError) {
    throw new Error("Unable to load student profile.");
  }

  let pickupSession = null;

  if (profile.hostel_id) {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("pickup_sessions")
      .select("id, scheduled_date, start_time, end_time, status")
      .eq("hostel_id", profile.hostel_id)
      .in("status", ["ANNOUNCED", "ACTIVE"])
      .gte("scheduled_date", today)
      .order("scheduled_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error("Unable to load pickup information.");
    }

    pickupSession = data;
  }

  const { data: laundryOrders, error: laundryError } = await supabase
    .from("laundry_orders")
    .select(
      `
        id,
        order_number,
        status,
        submitted_at,
        created_at,
        bags (
          bag_code
        )
      `,
    )
    .eq("student_id", studentId)
    .in("status", [...ACTIVE_LAUNDRY_STATUSES])
    .order("created_at", { ascending: false });

  if (laundryError) {
    throw new Error("Unable to load laundry information.");
  }

  const unreadCount = await getUnreadNotificationCount(studentId);
  const hostel = Array.isArray(profile.hostels)
    ? profile.hostels[0]
    : profile.hostels;

  return {
    pickupSession,
    hostelName: hostel?.name ?? null,
    laundryOrders: laundryOrders ?? [],
    unreadCount,
  };
}

export async function getStudentOrders(
  studentId: string,
  mode: "active" | "history",
) {
  const supabase = await createClient();

  let query = supabase
    .from("laundry_orders")
    .select(
      `
        id,
        order_number,
        status,
        submitted_at,
        completed_at,
        created_at,
        bags (
          bag_code
        )
      `,
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  query =
    mode === "history"
      ? query.eq("status", "DELIVERED")
      : query.in("status", [...ACTIVE_LAUNDRY_STATUSES]);

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load laundry orders.");
  }

  return data ?? [];
}

export async function getStudentOrderDetail(studentId: string, orderId: string) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("laundry_orders")
    .select(
      `
        id,
        order_number,
        status,
        submitted_at,
        completed_at,
        created_at,
        pickup_session_id,
        bags (
          bag_code
        )
      `,
    )
    .eq("id", orderId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load laundry order.");
  }

  if (!order) {
    return null;
  }

  const { data: history, error: historyError } = await supabase
    .from("status_history")
    .select("id, from_status, to_status, reason, created_at")
    .eq("laundry_order_id", order.id)
    .order("created_at", { ascending: true });

  if (historyError) {
    throw new Error("Unable to load laundry history.");
  }

  const { data: session } = await supabase
    .from("pickup_sessions")
    .select("delivery_boy_id")
    .eq("id", order.pickup_session_id)
    .maybeSingle();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, message, created_at")
    .eq("laundry_order_id", order.id)
    .order("created_at", { ascending: true });

  return {
    order,
    statusHistory: history ?? [],
    deliveryBoyId: session?.delivery_boy_id ?? null,
    messages: messages ?? [],
  };
}

export async function getStudentNotifications(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, is_read, created_at, laundry_order_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error("Unable to load notifications.");
  }

  return data ?? [];
}

export async function getStudentComplaints(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("complaints")
    .select(
      "id, complaint_number, type, status, description, created_at, laundry_order_id",
    )
    .eq("reported_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load complaints.");
  }

  return data ?? [];
}

export async function getStudentProfilePageData(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "full_name, phone, room_number, roll_number, hostel_id, hostels(name, code)",
    )
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Unable to load profile.");
  }

  const { data: bags } = await supabase
    .from("bags")
    .select("id, bag_code, is_active")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  const hostel = Array.isArray(profile.hostels)
    ? profile.hostels[0]
    : profile.hostels;

  return {
    profile,
    hostel,
    bags: bags ?? [],
  };
}
