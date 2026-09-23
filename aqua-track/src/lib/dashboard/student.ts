import { createClient } from "@/lib/supabase/server";

export async function getStudentDashboardData(studentId: string) {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("hostel_id")
    .eq("id", studentId)
    .single();

  if (profileError) {
    throw new Error("Unable to load student profile.");
  }

  let pickupSession = null;

  if (profile.hostel_id) {
    const { data, error } = await supabase
      .from("pickup_sessions")
      .select("id, scheduled_date, start_time, end_time, status")
      .eq("hostel_id", profile.hostel_id)
      .in("status", ["ANNOUNCED", "ACTIVE"])
      .order("scheduled_date", { ascending: true })
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
    .order("created_at", { ascending: false });

  if (laundryError) {
    throw new Error("Unable to load laundry information.");
  }

  const orders = laundryOrders ?? [];

  const orderIds = orders.map((order) => order.id);

  let statusHistory: Array<{
    id: string;
    laundry_order_id: string;
    from_status: string | null;
    to_status: string;
    changed_by: string;
    reason: string | null;
    created_at: string;
  }> = [];

  if (orderIds.length > 0) {
    const { data: history, error: historyError } = await supabase
      .from("status_history")
      .select(
        `
          id,
          laundry_order_id,
          from_status,
          to_status,
          changed_by,
          reason,
          created_at
        `,
      )
      .in("laundry_order_id", orderIds)
      .order("created_at", { ascending: true });

    if (historyError) {
      throw new Error("Unable to load laundry history.");
    }

    statusHistory = history ?? [];
  }

  return {
    pickupSession,
    laundryOrders: orders,
    statusHistory,
  };
}