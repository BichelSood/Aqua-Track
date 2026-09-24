import { createClient } from "@/lib/supabase/server";

export async function getAdminDashboardData() {
  const supabase = await createClient();

  const [
    profilesResult,
    hostelsResult,
    pickupSessionsResult,
    laundryOrdersResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, is_active")
      .order("full_name", { ascending: true }),

    supabase
      .from("hostels")
      .select("id, name, code, is_active")
      .order("name", { ascending: true }),

    supabase
      .from("pickup_sessions")
      .select(
        "id, scheduled_date, start_time, end_time, status, hostel_id, delivery_boy_id",
      )
      .order("scheduled_date", { ascending: false }),

    supabase
      .from("laundry_orders")
      .select(
        "id, order_number, status, student_id, pickup_session_id, created_at",
      )
      .order("created_at", { ascending: false }),
  ]);

  if (profilesResult.error) {
    throw new Error("Unable to load users.");
  }

  if (hostelsResult.error) {
    throw new Error("Unable to load hostels.");
  }

  if (pickupSessionsResult.error) {
    throw new Error("Unable to load pickup sessions.");
  }

  if (laundryOrdersResult.error) {
    throw new Error("Unable to load laundry orders.");
  }

  const profiles = profilesResult.data ?? [];
  const hostels = hostelsResult.data ?? [];
  const pickupSessions = pickupSessionsResult.data ?? [];
  const laundryOrders = laundryOrdersResult.data ?? [];

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const hostelMap = new Map(hostels.map((hostel) => [hostel.id, hostel]));

  const enrichedPickupSessions = pickupSessions.map((session) => ({
    ...session,
    hostel: hostelMap.get(session.hostel_id) ?? null,
    deliveryBoy: session.delivery_boy_id
      ? (profileMap.get(session.delivery_boy_id) ?? null)
      : null,
  }));

  const orderStatusCounts = laundryOrders.reduce(
    (counts, order) => {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );

  const roleCounts = profiles.reduce(
    (counts, profile) => {
      counts[profile.role] = (counts[profile.role] ?? 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );

  return {
    profiles,
    hostels,
    pickupSessions: enrichedPickupSessions,
    laundryOrders,
    orderStatusCounts,
    roleCounts,
  };
}
