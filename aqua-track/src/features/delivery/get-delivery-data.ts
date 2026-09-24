import { createClient } from "@/lib/supabase/server";

const pickupSelect = `
  id,
  scheduled_date,
  start_time,
  end_time,
  status,
  hostel_id,
  hostels(name, code)
`;

export async function getDeliveryDashboardData(deliveryBoyId: string) {
  const supabase = await createClient();

  const { data: pickupSessions, error: pickupError } = await supabase
    .from("pickup_sessions")
    .select(pickupSelect)
    .eq("delivery_boy_id", deliveryBoyId)
    .in("status", ["ANNOUNCED", "ACTIVE"])
    .order("scheduled_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (pickupError) {
    throw new Error("Unable to load pickup sessions.");
  }

  const { data: deliveryBatches, error: batchError } = await supabase
    .from("delivery_batches")
    .select("id, batch_number, status, hostel_id, created_at, hostels(name, code)")
    .eq("delivery_boy_id", deliveryBoyId)
    .in("status", ["CREATED", "READY", "OUT_FOR_DELIVERY"])
    .order("created_at", { ascending: false });

  if (batchError) {
    throw new Error("Unable to load delivery batches.");
  }

  const activePickup = (pickupSessions ?? []).find(
    (session) => session.status === "ACTIVE",
  );
  const outForDelivery = (deliveryBatches ?? []).filter(
    (batch) => batch.status === "OUT_FOR_DELIVERY",
  );

  let collectedCount = 0;

  if (activePickup) {
    const { count } = await supabase
      .from("laundry_orders")
      .select("id", { count: "exact", head: true })
      .eq("pickup_session_id", activePickup.id);

    collectedCount = count ?? 0;
  }

  return {
    pickupSessions: pickupSessions ?? [],
    deliveryBatches: deliveryBatches ?? [],
    activePickup: activePickup ?? null,
    collectedCount,
    openBatchCount: (deliveryBatches ?? []).length,
    outForDeliveryCount: outForDelivery.length,
  };
}

export async function getDeliveryPickups(deliveryBoyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pickup_sessions")
    .select(pickupSelect)
    .eq("delivery_boy_id", deliveryBoyId)
    .in("status", ["SCHEDULED", "ANNOUNCED", "ACTIVE"])
    .order("scheduled_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error("Unable to load pickup sessions.");
  }

  return data ?? [];
}

export async function getDeliveryPickupDetail(
  deliveryBoyId: string,
  pickupSessionId: string,
) {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("pickup_sessions")
    .select(pickupSelect)
    .eq("id", pickupSessionId)
    .eq("delivery_boy_id", deliveryBoyId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load pickup session.");
  }

  if (!session) {
    return null;
  }

  const { data: orders, error: orderError } = await supabase
    .from("laundry_orders")
    .select(
      `
        id,
        order_number,
        status,
        created_at,
        bags (
          bag_code
        ),
        profiles!laundry_orders_student_id_fkey (
          full_name
        )
      `,
    )
    .eq("pickup_session_id", session.id)
    .order("created_at", { ascending: true });

  if (orderError) {
    throw new Error("Unable to load collection progress.");
  }

  return {
    session,
    orders: orders ?? [],
  };
}

export async function getDeliveryBatchesPage(deliveryBoyId: string) {
  const supabase = await createClient();

  const { data: deliveryBatches, error: batchError } = await supabase
    .from("delivery_batches")
    .select("id, batch_number, status, hostel_id, created_at, hostels(name, code)")
    .eq("delivery_boy_id", deliveryBoyId)
    .in("status", ["CREATED", "READY", "OUT_FOR_DELIVERY"])
    .order("created_at", { ascending: false });

  if (batchError) {
    throw new Error("Unable to load delivery batches.");
  }

  const { data: readyOrders, error: orderError } = await supabase
    .from("laundry_orders")
    .select(
      `
        id,
        order_number,
        status,
        created_at,
        pickup_session_id,
        delivery_batch_id,
        bags (
          bag_code
        ),
        profiles!laundry_orders_student_id_fkey (
          full_name
        ),
        pickup_sessions!inner (
          delivery_boy_id,
          hostel_id,
          hostels(name, code)
        )
      `,
    )
    .eq("pickup_sessions.delivery_boy_id", deliveryBoyId)
    .in("status", [
      "READY_FOR_DELIVERY",
      "OUT_FOR_DELIVERY",
      "DELIVERY_ATTEMPTED",
    ])
    .order("created_at", { ascending: true });

  if (orderError) {
    throw new Error("Unable to load delivery orders.");
  }

  return {
    deliveryBatches: deliveryBatches ?? [],
    orders: readyOrders ?? [],
  };
}
