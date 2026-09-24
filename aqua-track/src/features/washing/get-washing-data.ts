import { createClient } from "@/lib/supabase/server";

const orderSelect = `
  id,
  order_number,
  status,
  created_at,
  submitted_at,
  bags (
    bag_code
  ),
  profiles!laundry_orders_student_id_fkey (
    full_name
  )
`;

export async function getWashingDashboardData(facilityId: string | null) {
  const supabase = await createClient();

  let incomingQuery = supabase
    .from("washing_batches")
    .select("id", { count: "exact", head: true })
    .eq("status", "CREATED");

  if (facilityId) {
    incomingQuery = incomingQuery.eq("facility_id", facilityId);
  }

  const processingQuery = facilityId
    ? supabase
        .from("laundry_orders")
        .select("id, washing_batches!inner(facility_id)", {
          count: "exact",
          head: true,
        })
        .eq("status", "UNDER_WASHING")
        .eq("washing_batches.facility_id", facilityId)
    : supabase
        .from("laundry_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "UNDER_WASHING");

  const readyQuery = facilityId
    ? supabase
        .from("laundry_orders")
        .select("id, washing_batches!inner(facility_id)", {
          count: "exact",
          head: true,
        })
        .eq("status", "READY_FOR_DELIVERY")
        .eq("washing_batches.facility_id", facilityId)
    : supabase
        .from("laundry_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "READY_FOR_DELIVERY");

  let batchesQuery = supabase
    .from("washing_batches")
    .select("id, batch_number, status, created_at")
    .in("status", ["CREATED", "RECEIVED", "PROCESSING"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (facilityId) {
    batchesQuery = batchesQuery.eq("facility_id", facilityId);
  }

  const [incoming, processing, ready, recentBatches] = await Promise.all([
    incomingQuery,
    processingQuery,
    readyQuery,
    batchesQuery,
  ]);

  return {
    incomingCount: incoming.count ?? 0,
    processingCount: processing.count ?? 0,
    readyCount: ready.count ?? 0,
    recentBatches: recentBatches.data ?? [],
  };
}

export async function getWashingBatches(facilityId: string | null) {
  const supabase = await createClient();

  let query = supabase
    .from("washing_batches")
    .select("id, batch_number, status, created_at, facility_id")
    .in("status", ["CREATED", "RECEIVED", "PROCESSING"])
    .order("created_at", { ascending: true });

  if (facilityId) {
    query = query.eq("facility_id", facilityId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load washing batches.");
  }

  return data ?? [];
}

export async function getWashingQueue() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("laundry_orders")
    .select(orderSelect)
    .in("status", ["COLLECTED", "RECEIVED_AT_FACILITY", "UNDER_WASHING"])
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load laundry orders.");
  }

  return data ?? [];
}

export async function getWashingFacilityName(facilityId: string | null) {
  if (!facilityId) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("facilities")
    .select("name, code")
    .eq("id", facilityId)
    .maybeSingle();

  return data ?? null;
}
