import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

function pageRange(page: number) {
  const from = page * PAGE_SIZE;
  return { from, to: from + PAGE_SIZE - 1 };
}

export async function getAdminUsers(filters: {
  q?: string;
  role?: string;
  page?: number;
}) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page ?? 0);

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, role, is_active, hostel_id, facility_id, phone, roll_number, hostels(name, code), facilities(name, code)",
      { count: "exact" },
    )
    .order("full_name", { ascending: true })
    .range(from, to);

  if (filters.role) {
    query = query.eq("role", filters.role);
  }

  if (filters.q) {
    query = query.ilike("full_name", `%${filters.q}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error("Unable to load users.");
  }

  return { rows: data ?? [], count: count ?? 0 };
}

export async function getAdminUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, is_active, hostel_id, facility_id, phone, roll_number",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load user.");
  }

  return data;
}

export async function getAdminOrders(filters: {
  q?: string;
  status?: string;
  page?: number;
}) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page ?? 0);

  let query = supabase
    .from("laundry_orders")
    .select(
      "id, order_number, status, created_at, student_id, bags(bag_code), profiles!laundry_orders_student_id_fkey(full_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.q) {
    query = query.ilike("order_number", `%${filters.q}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error("Unable to load orders.");
  }

  return { rows: data ?? [], count: count ?? 0 };
}

export async function getAdminOrder(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("laundry_orders")
    .select("id, order_number, status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load order.");
  }

  return data;
}

export async function getAdminBags(filters: { q?: string; page?: number }) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page ?? 0);

  let query = supabase
    .from("bags")
    .select(
      "id, bag_code, is_active, created_at, owner_id, profiles!bags_owner_id_fkey(full_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.q) {
    query = query.ilike("bag_code", `%${filters.q}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error("Unable to load bags.");
  }

  return { rows: data ?? [], count: count ?? 0 };
}

export async function getAdminHostels() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hostels")
    .select("id, name, code, address, is_active")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load hostels.");
  }

  return data ?? [];
}

export async function getAdminFacilities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facilities")
    .select("id, name, code, address, is_active")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load facilities.");
  }

  return data ?? [];
}

export async function getAdminBatches() {
  const supabase = await createClient();

  const [washing, delivery] = await Promise.all([
    supabase
      .from("washing_batches")
      .select("id, batch_number, status, created_at, facilities(name, code)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("delivery_batches")
      .select("id, batch_number, status, created_at, hostels(name, code)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (washing.error) {
    throw new Error("Unable to load washing batches.");
  }

  if (delivery.error) {
    throw new Error("Unable to load delivery batches.");
  }

  return {
    washing: washing.data ?? [],
    delivery: delivery.data ?? [],
  };
}

export async function getAdminComplaints(filters: { status?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("complaints")
    .select(
      "id, complaint_number, type, status, description, created_at, laundry_order_id",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to load complaints.");
  }

  return data ?? [];
}

export async function getAdminAuditLogs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("Unable to load audit logs.");
  }

  return data ?? [];
}

export async function getAdminStudents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "STUDENT")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error("Unable to load students.");
  }

  return data ?? [];
}

export { PAGE_SIZE };
