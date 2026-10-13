#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = join(ROOT, "scripts/data/aqua-track-demo-manifest.json");
const MANIFEST = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const VALID_STATUSES = new Set([
  "COLLECTED",
  "RECEIVED_AT_FACILITY",
  "UNDER_WASHING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERY_ATTEMPTED",
]);

function parseArgs(argv) {
  const args = {
    dryRun: false,
    apply: false,
    verifyOnly: false,
    confirmProductionWrite: false,
    allowNonstandardProductionUrl: false,
    envFile: null,
    demoDate: new Date().toISOString().slice(0, 10),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--apply") args.apply = true;
    else if (arg === "--verify-only") args.verifyOnly = true;
    else if (arg === "--confirm-production-write") args.confirmProductionWrite = true;
    else if (arg === "--allow-nonstandard-production-url") args.allowNonstandardProductionUrl = true;
    else if (arg === "--env-file") args.envFile = argv[++index];
    else if (arg === "--demo-date") args.demoDate = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }

  const selectedModes = [args.dryRun, args.apply, args.verifyOnly].filter(Boolean).length;
  if (selectedModes !== 1) {
    throw new Error("Choose exactly one mode: --dry-run, --apply, or --verify-only.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.demoDate)) {
    throw new Error("--demo-date must be YYYY-MM-DD.");
  }

  return args;
}

function loadEnvFile(path) {
  if (!path) return;
  if (!existsSync(path)) {
    throw new Error(`Env file not found: ${path}`);
  }

  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function requireProductionConfig(args) {
  const url = process.env.PRODUCTION_SUPABASE_URL;
  const serviceRoleKey = process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY;
  const demoPassword = process.env.PRODUCTION_DEMO_PASSWORD;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Set PRODUCTION_SUPABASE_URL and PRODUCTION_SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (!args.verifyOnly && !demoPassword) {
    throw new Error("Set PRODUCTION_DEMO_PASSWORD for newly created demo users.");
  }

  const parsed = new URL(url);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (parsed.protocol !== "https:" || localHosts.has(parsed.hostname)) {
    throw new Error("Refusing to target a local or non-HTTPS Supabase URL.");
  }

  if (
    !args.allowNonstandardProductionUrl &&
    !/^[a-z0-9-]+\.supabase\.co$/i.test(parsed.hostname)
  ) {
    throw new Error(
      "Supabase URL is not a standard hosted project URL. Pass --allow-nonstandard-production-url only after verifying it is production.",
    );
  }

  if (args.apply && !args.confirmProductionWrite) {
    throw new Error("Production writes require --confirm-production-write.");
  }

  return { url: parsed.origin, serviceRoleKey, demoPassword };
}

function allAccounts() {
  return [
    ...MANIFEST.students.map((student) => ({
      ...student,
      role: "STUDENT",
      type: "student",
    })),
    ...MANIFEST.staff.map((staff) => ({ ...staff, type: "staff" })),
  ];
}

function orderNumberFor(student) {
  return `PROD-DEMO-${student.rollNumber}`;
}

function pickupKey(hostelCode) {
  return `PROD-DEMO-PICKUP-${hostelCode}`;
}

function washingBatchNumber(hostelCode) {
  return `PROD-DEMO-WB-${hostelCode}`;
}

function deliveryBatchNumber(hostelCode) {
  return `PROD-DEMO-DB-${hostelCode}`;
}

function blankCounts() {
  return {
    planned: 0,
    created: 0,
    updated: 0,
    existing: 0,
    verified: 0,
    skipped: 0,
    conflicts: 0,
  };
}

class Reporter {
  constructor({ dryRun }) {
    this.dryRun = dryRun;
    this.counts = blankCounts();
    this.conflicts = [];
  }

  plan(message) {
    this.counts.planned += 1;
    console.log(`${this.dryRun ? "PLAN" : "DO"}   ${message}`);
  }

  created(message) {
    this.counts.created += 1;
    console.log(`CREATE ${message}`);
  }

  updated(message) {
    this.counts.updated += 1;
    console.log(`UPDATE ${message}`);
  }

  existing(message) {
    this.counts.existing += 1;
    console.log(`EXIST ${message}`);
  }

  verified(message) {
    this.counts.verified += 1;
    console.log(`PASS  ${message}`);
  }

  skipped(message) {
    this.counts.skipped += 1;
    console.log(`SKIP  ${message}`);
  }

  conflict(message) {
    this.counts.conflicts += 1;
    this.conflicts.push(message);
    console.log(`FAIL  ${message}`);
  }

  assertNoConflicts() {
    if (this.conflicts.length > 0) {
      throw new Error(`Stopped with ${this.conflicts.length} conflict(s).`);
    }
  }

  summary() {
    console.log("\nSummary");
    for (const [key, value] of Object.entries(this.counts)) {
      console.log(`  ${key}: ${value}`);
    }
  }
}

async function listAuthUsers(supabase) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if (!data.users || data.users.length < 1000) break;
  }
  return new Map(users.map((user) => [user.email?.toLowerCase(), user]));
}

async function selectOne(supabase, table, column, value) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq(column, value)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function selectMany(supabase, table, column, values) {
  if (values.length === 0) return [];
  const { data, error } = await supabase.from(table).select("*").in(column, values);
  if (error) throw error;
  return data ?? [];
}

async function insertRow(supabase, table, row) {
  const { data, error } = await supabase.from(table).insert(row).select("*").single();
  if (error) throw error;
  return data;
}

async function updateRow(supabase, table, column, value, patch) {
  const { data, error } = await supabase
    .from(table)
    .update(patch)
    .eq(column, value)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function ensureAuthUsers({ supabase, reporter, args, password }) {
  const usersByEmail = await listAuthUsers(supabase);

  for (const account of allAccounts()) {
    const email = account.email.toLowerCase();
    if (usersByEmail.has(email)) {
      reporter.existing(`auth user ${email}`);
      continue;
    }

    reporter.plan(`create auth user ${email}`);
    if (args.dryRun) continue;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: account.fullName },
    });
    if (error) throw error;
    usersByEmail.set(email, data.user);
    reporter.created(`auth user ${email}`);
  }

  return usersByEmail;
}

async function ensureHostelsAndFacility({ supabase, reporter, args }) {
  const hostelIds = new Map();

  for (const hostel of MANIFEST.hostels) {
    const existing = await selectOne(supabase, "hostels", "code", hostel.code);
    if (existing) {
      if (!existing.is_active) reporter.conflict(`hostel ${hostel.code} exists but is inactive`);
      reporter.existing(`hostel ${hostel.code}`);
      hostelIds.set(hostel.code, existing.id);
      continue;
    }

    reporter.plan(`create hostel ${hostel.code}`);
    if (args.dryRun) continue;
    const created = await insertRow(supabase, "hostels", {
      name: hostel.name,
      code: hostel.code,
      address: hostel.address,
      is_active: true,
    });
    hostelIds.set(hostel.code, created.id);
    reporter.created(`hostel ${hostel.code}`);
  }

  let facility = await selectOne(supabase, "facilities", "code", MANIFEST.facility.code);
  if (facility) {
    if (!facility.is_active) reporter.conflict(`facility ${MANIFEST.facility.code} exists but is inactive`);
    reporter.existing(`facility ${MANIFEST.facility.code}`);
  } else {
    reporter.plan(`create facility ${MANIFEST.facility.code}`);
    if (!args.dryRun) {
      facility = await insertRow(supabase, "facilities", {
        name: MANIFEST.facility.name,
        code: MANIFEST.facility.code,
        address: MANIFEST.facility.address,
        is_active: true,
      });
      reporter.created(`facility ${MANIFEST.facility.code}`);
    }
  }

  return { hostelIds, facilityId: facility?.id ?? null };
}

function profileFor(account, userId, hostelIds, facilityId) {
  if (account.type === "student") {
    return {
      id: userId,
      full_name: account.fullName,
      phone: account.phone,
      role: "STUDENT",
      hostel_id: hostelIds.get(account.hostelCode),
      facility_id: null,
      room_number: account.roomNumber,
      roll_number: account.rollNumber,
      is_active: true,
    };
  }

  return {
    id: userId,
    full_name: account.fullName,
    phone: account.phone ?? null,
    role: account.role,
    hostel_id: null,
    facility_id: account.role === "WASHING_STAFF" ? facilityId : null,
    room_number: null,
    roll_number: account.rollNumber ?? null,
    is_active: true,
  };
}

function differs(existing, expected, keys) {
  return keys.some((key) => (existing[key] ?? null) !== (expected[key] ?? null));
}

async function ensureProfiles({ supabase, reporter, args, usersByEmail, hostelIds, facilityId }) {
  const profileIds = new Map();

  for (const account of allAccounts()) {
    const user = usersByEmail.get(account.email.toLowerCase());
    if (!user) {
      reporter.skipped(`profile ${account.email} because auth user would be created in apply mode`);
      continue;
    }

    const expected = profileFor(account, user.id, hostelIds, facilityId);
    if (account.type === "student" && !expected.hostel_id) {
      reporter.conflict(`missing hostel ${account.hostelCode} for ${account.email}`);
      continue;
    }
    if (account.role === "WASHING_STAFF" && !expected.facility_id) {
      reporter.conflict(`missing washing facility for ${account.email}`);
      continue;
    }

    const existing = await selectOne(supabase, "profiles", "id", user.id);
    const keys = [
      "full_name",
      "phone",
      "role",
      "hostel_id",
      "facility_id",
      "room_number",
      "roll_number",
      "is_active",
    ];

    if (!existing) {
      reporter.plan(`create profile ${account.email}`);
      if (!args.dryRun) {
        await insertRow(supabase, "profiles", expected);
        reporter.created(`profile ${account.email}`);
      }
    } else if (differs(existing, expected, keys)) {
      reporter.plan(`update profile ${account.email}`);
      if (!args.dryRun) {
        await updateRow(supabase, "profiles", "id", user.id, expected);
        reporter.updated(`profile ${account.email}`);
      }
    } else {
      reporter.existing(`profile ${account.email}`);
    }

    profileIds.set(account.email.toLowerCase(), user.id);
  }

  return profileIds;
}

async function ensureBags({ supabase, reporter, args, profileIds }) {
  const bagIds = new Map();

  for (const student of MANIFEST.students) {
    const ownerId = profileIds.get(student.email);
    if (!ownerId) {
      reporter.skipped(`bag ${student.bagCode} because profile would be created in apply mode`);
      continue;
    }

    const byCode = await selectOne(supabase, "bags", "bag_code", student.bagCode);
    const byToken = await selectOne(supabase, "bags", "qr_token", student.qrToken);

    if (byToken && byToken.bag_code !== student.bagCode) {
      reporter.conflict(`QR token for ${student.bagCode} is already assigned to ${byToken.bag_code}`);
      continue;
    }

    if (!byCode) {
      reporter.plan(`create bag ${student.bagCode}`);
      if (!args.dryRun) {
        const created = await insertRow(supabase, "bags", {
          bag_code: student.bagCode,
          qr_token: student.qrToken,
          owner_id: ownerId,
          is_active: true,
        });
        bagIds.set(student.bagCode, created.id);
        reporter.created(`bag ${student.bagCode}`);
      }
      continue;
    }

    if (byCode.owner_id !== ownerId) {
      reporter.conflict(`bag ${student.bagCode} belongs to a different profile`);
      continue;
    }

    const patch = {};
    if (byCode.qr_token !== student.qrToken) patch.qr_token = student.qrToken;
    if (byCode.is_active !== true) patch.is_active = true;

    if (Object.keys(patch).length > 0) {
      reporter.plan(`update bag ${student.bagCode}`);
      if (!args.dryRun) {
        const updated = await updateRow(supabase, "bags", "id", byCode.id, patch);
        bagIds.set(student.bagCode, updated.id);
        reporter.updated(`bag ${student.bagCode}`);
      }
    } else {
      bagIds.set(student.bagCode, byCode.id);
      reporter.existing(`bag ${student.bagCode}`);
    }
  }

  return bagIds;
}

async function ensurePickup({ supabase, reporter, args, hostelId, deliveryBoyId, hostelCode, date }) {
  const existingRows = await selectMany(supabase, "pickup_sessions", "hostel_id", [hostelId]);
  const existing = existingRows.find(
    (row) =>
      row.delivery_boy_id === deliveryBoyId &&
      row.scheduled_date === date &&
      row.start_time === "09:00:00" &&
      row.end_time === "12:00:00" &&
      row.status !== "CANCELLED",
  );

  if (existing) {
    if (existing.status !== "ACTIVE") {
      reporter.plan(`activate pickup ${pickupKey(hostelCode)}`);
      if (!args.dryRun) {
        const updated = await updateRow(supabase, "pickup_sessions", "id", existing.id, {
          status: "ACTIVE",
          announced_at: existing.announced_at ?? new Date().toISOString(),
          started_at: existing.started_at ?? new Date().toISOString(),
        });
        reporter.updated(`pickup ${pickupKey(hostelCode)}`);
        return updated;
      }
    }
    reporter.existing(`pickup ${pickupKey(hostelCode)}`);
    return existing;
  }

  reporter.plan(`create pickup ${pickupKey(hostelCode)}`);
  if (args.dryRun) return null;
  const created = await insertRow(supabase, "pickup_sessions", {
    hostel_id: hostelId,
    delivery_boy_id: deliveryBoyId,
    scheduled_date: date,
    start_time: "09:00",
    end_time: "12:00",
    status: "ACTIVE",
    announced_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
  });
  reporter.created(`pickup ${pickupKey(hostelCode)}`);
  return created;
}

async function ensureWashingBatch({ supabase, reporter, args, hostelCode, pickupId, facilityId, deliveryBoyId, status }) {
  const batchNumber = washingBatchNumber(hostelCode);
  const existing = await selectOne(supabase, "washing_batches", "batch_number", batchNumber);
  const patch = {
    pickup_session_id: pickupId,
    facility_id: facilityId,
    created_by: deliveryBoyId,
    status,
  };

  if (!existing) {
    reporter.plan(`create washing batch ${batchNumber}`);
    if (args.dryRun) return null;
    const created = await insertRow(supabase, "washing_batches", {
      batch_number: batchNumber,
      ...patch,
      received_at: status === "CREATED" ? null : new Date().toISOString(),
      started_at: status === "PROCESSING" || status === "COMPLETED" ? new Date().toISOString() : null,
      completed_at: status === "COMPLETED" ? new Date().toISOString() : null,
    });
    reporter.created(`washing batch ${batchNumber}`);
    return created;
  }

  if (differs(existing, patch, Object.keys(patch))) {
    reporter.plan(`update washing batch ${batchNumber}`);
    if (!args.dryRun) {
      const updated = await updateRow(supabase, "washing_batches", "id", existing.id, patch);
      reporter.updated(`washing batch ${batchNumber}`);
      return updated;
    }
  }

  reporter.existing(`washing batch ${batchNumber}`);
  return existing;
}

async function ensureDeliveryBatch({ supabase, reporter, args, hostelCode, hostelId, deliveryBoyId }) {
  const batchNumber = deliveryBatchNumber(hostelCode);
  const existing = await selectOne(supabase, "delivery_batches", "batch_number", batchNumber);
  const patch = {
    hostel_id: hostelId,
    delivery_boy_id: deliveryBoyId,
    status: "OUT_FOR_DELIVERY",
  };

  if (!existing) {
    reporter.plan(`create delivery batch ${batchNumber}`);
    if (args.dryRun) return null;
    const created = await insertRow(supabase, "delivery_batches", {
      batch_number: batchNumber,
      ...patch,
      started_at: new Date().toISOString(),
    });
    reporter.created(`delivery batch ${batchNumber}`);
    return created;
  }

  if (differs(existing, patch, Object.keys(patch))) {
    reporter.plan(`update delivery batch ${batchNumber}`);
    if (!args.dryRun) {
      const updated = await updateRow(supabase, "delivery_batches", "id", existing.id, patch);
      reporter.updated(`delivery batch ${batchNumber}`);
      return updated;
    }
  }

  reporter.existing(`delivery batch ${batchNumber}`);
  return existing;
}

async function activeOrderForBag(supabase, bagId) {
  const { data, error } = await supabase
    .from("laundry_orders")
    .select("*")
    .eq("bag_id", bagId)
    .neq("status", "DELIVERED")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

function orderPatchForStatus({ student, pickupId, washingBatchId, deliveryBatchId }) {
  const patch = {
    status: student.expectedStatus,
    pickup_session_id: pickupId,
    washing_batch_id: ["COLLECTED", "RECEIVED_AT_FACILITY", "UNDER_WASHING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERY_ATTEMPTED"].includes(student.expectedStatus)
      ? washingBatchId
      : null,
    delivery_batch_id: ["OUT_FOR_DELIVERY", "DELIVERY_ATTEMPTED"].includes(student.expectedStatus)
      ? deliveryBatchId
      : null,
    completed_at: null,
  };

  return patch;
}

async function ensureStatusHistory({ supabase, reporter, args, order, status, changedBy }) {
  const { data, error } = await supabase
    .from("status_history")
    .select("id")
    .eq("laundry_order_id", order.id)
    .eq("to_status", status)
    .limit(1);
  if (error) throw error;

  if (data && data.length > 0) {
    reporter.existing(`status history ${order.order_number} ${status}`);
    return;
  }

  reporter.plan(`create status history ${order.order_number} ${status}`);
  if (args.dryRun) return;
  await insertRow(supabase, "status_history", {
    laundry_order_id: order.id,
    from_status: null,
    to_status: status,
    changed_by: changedBy,
    reason: "Production demo seed.",
  });
  reporter.created(`status history ${order.order_number} ${status}`);
}

async function ensureOrders({ supabase, reporter, args, hostelIds, facilityId, profileIds, bagIds }) {
  const d1 = profileIds.get("d1@aquatrack.local");
  const d2 = profileIds.get("d2@aquatrack.local");
  const washing = profileIds.get("washing@aquatrack.local");
  if (!d1 || !d2 || !washing || !facilityId) {
    reporter.skipped("orders because required staff/facility would be created in apply mode");
    return;
  }

  const pickups = new Map();
  for (const hostelCode of ["H1", "H2", "H3"]) {
    const hostelId = hostelIds.get(hostelCode);
    const deliveryBoyId = hostelCode === "H3" ? d2 : d1;
    if (!hostelId) {
      reporter.conflict(`missing hostel ${hostelCode}`);
      continue;
    }
    pickups.set(
      hostelCode,
      await ensurePickup({
        supabase,
        reporter,
        args,
        hostelId,
        deliveryBoyId,
        hostelCode,
        date: args.demoDate,
      }),
    );
  }

  if (args.dryRun) {
    reporter.skipped("order creation detail because dry-run has no generated pickup/batch ids for missing records");
    return;
  }

  const h2WashingBatch = await ensureWashingBatch({
    supabase,
    reporter,
    args,
    hostelCode: "H2",
    pickupId: pickups.get("H2").id,
    facilityId,
    deliveryBoyId: d1,
    status: "PROCESSING",
  });
  const h3WashingBatch = await ensureWashingBatch({
    supabase,
    reporter,
    args,
    hostelCode: "H3",
    pickupId: pickups.get("H3").id,
    facilityId,
    deliveryBoyId: d2,
    status: "COMPLETED",
  });
  const h3DeliveryBatch = await ensureDeliveryBatch({
    supabase,
    reporter,
    args,
    hostelCode: "H3",
    hostelId: hostelIds.get("H3"),
    deliveryBoyId: d2,
  });

  for (const student of MANIFEST.students) {
    const bagId = bagIds.get(student.bagCode);
    const studentId = profileIds.get(student.email);
    if (!bagId || !studentId) {
      reporter.skipped(`order ${student.bagCode} because bag/profile would be created in apply mode`);
      continue;
    }

    const activeOrder = await activeOrderForBag(supabase, bagId);
    if (!student.expectedStatus) {
      if (activeOrder) {
        reporter.conflict(`${student.bagCode} should have no active order but has ${activeOrder.order_number}`);
      } else {
        reporter.verified(`${student.bagCode} has no active order`);
      }
      continue;
    }

    if (!VALID_STATUSES.has(student.expectedStatus)) {
      reporter.conflict(`${student.email} has unsupported status ${student.expectedStatus}`);
      continue;
    }

    const expectedOrderNumber = orderNumberFor(student);
    if (activeOrder && activeOrder.order_number !== expectedOrderNumber) {
      reporter.conflict(`${student.bagCode} already has a different active order ${activeOrder.order_number}`);
      continue;
    }

    const pickup = pickups.get(student.hostelCode);
    const washingBatch = student.hostelCode === "H2" ? h2WashingBatch : h3WashingBatch;
    const deliveryBatch = student.hostelCode === "H3" ? h3DeliveryBatch : null;
    const patch = orderPatchForStatus({
      student,
      pickupId: pickup.id,
      washingBatchId: washingBatch?.id ?? null,
      deliveryBatchId: deliveryBatch?.id ?? null,
    });

    let order = activeOrder;
    if (!order) {
      reporter.plan(`create order ${expectedOrderNumber}`);
      order = await insertRow(supabase, "laundry_orders", {
        order_number: expectedOrderNumber,
        bag_id: bagId,
        student_id: studentId,
        ...patch,
      });
      reporter.created(`order ${expectedOrderNumber}`);
    } else if (differs(order, patch, Object.keys(patch))) {
      reporter.plan(`update order ${expectedOrderNumber}`);
      order = await updateRow(supabase, "laundry_orders", "id", order.id, patch);
      reporter.updated(`order ${expectedOrderNumber}`);
    } else {
      reporter.existing(`order ${expectedOrderNumber}`);
    }

    await ensureStatusHistory({
      supabase,
      reporter,
      args,
      order,
      status: student.expectedStatus,
      changedBy: washing,
    });
  }
}

async function verify({ supabase, reporter }) {
  const usersByEmail = await listAuthUsers(supabase);
  const emails = allAccounts().map((account) => account.email.toLowerCase());
  const profiles = await selectMany(supabase, "profiles", "id", [...usersByEmail.values()].map((user) => user.id));
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const bags = await selectMany(supabase, "bags", "bag_code", MANIFEST.students.map((student) => student.bagCode));
  const bagsByCode = new Map(bags.map((bag) => [bag.bag_code, bag]));

  for (const account of allAccounts()) {
    const user = usersByEmail.get(account.email.toLowerCase());
    if (!user) {
      reporter.conflict(`missing auth user ${account.email}`);
      continue;
    }
    reporter.verified(`auth user ${account.email}`);

    const profile = profilesById.get(user.id);
    if (!profile) {
      reporter.conflict(`missing profile ${account.email}`);
      continue;
    }

    if (profile.full_name !== account.fullName || profile.role !== account.role || profile.is_active !== true) {
      reporter.conflict(`profile mismatch ${account.email}`);
    } else {
      reporter.verified(`profile ${account.email}`);
    }
  }

  for (const student of MANIFEST.students) {
    const user = usersByEmail.get(student.email);
    const profile = user ? profilesById.get(user.id) : null;
    const bag = bagsByCode.get(student.bagCode);
    if (!profile || !bag) {
      reporter.conflict(`missing profile or bag ${student.email}`);
      continue;
    }

    if (bag.owner_id !== profile.id || bag.qr_token !== student.qrToken || bag.is_active !== true) {
      reporter.conflict(`bag mismatch ${student.bagCode}`);
    } else {
      reporter.verified(`bag ${student.bagCode}`);
    }

    const byToken = await selectOne(supabase, "bags", "qr_token", student.qrToken);
    if (!byToken || byToken.bag_code !== student.bagCode) {
      reporter.conflict(`QR lookup mismatch ${student.bagCode}`);
    } else {
      reporter.verified(`QR lookup ${student.bagCode}`);
    }

    const activeOrder = await activeOrderForBag(supabase, bag.id);
    if (!student.expectedStatus) {
      if (activeOrder) reporter.conflict(`${student.bagCode} should have no active order`);
      else reporter.verified(`no active order ${student.bagCode}`);
      continue;
    }

    if (!activeOrder) {
      reporter.conflict(`missing active order ${student.bagCode}`);
      continue;
    }

    if (activeOrder.status !== student.expectedStatus) {
      reporter.conflict(`status mismatch ${student.bagCode}: expected ${student.expectedStatus}, found ${activeOrder.status}`);
    } else {
      reporter.verified(`status ${student.bagCode} ${student.expectedStatus}`);
    }

    if (["RECEIVED_AT_FACILITY", "UNDER_WASHING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERY_ATTEMPTED"].includes(student.expectedStatus) && !activeOrder.washing_batch_id) {
      reporter.conflict(`missing washing batch relationship ${student.bagCode}`);
    }
    if (["OUT_FOR_DELIVERY", "DELIVERY_ATTEMPTED"].includes(student.expectedStatus) && !activeOrder.delivery_batch_id) {
      reporter.conflict(`missing delivery batch relationship ${student.bagCode}`);
    }
  }

  for (const email of emails) {
    if (!usersByEmail.has(email)) reporter.conflict(`expected email not found ${email}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFile(args.envFile);
  const config = requireProductionConfig(args);
  const supabase = createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const reporter = new Reporter({ dryRun: args.dryRun });

  console.log("Aqua Track production demo seeder");
  console.log(`Target Supabase URL: ${config.url}`);
  console.log(`Mode: ${args.dryRun ? "dry-run" : args.apply ? "apply" : "verify-only"}`);
  console.log(`Demo accounts expected: ${MANIFEST.expectedCounts.accounts}`);
  console.log(`Student bags expected: ${MANIFEST.expectedCounts.bags}`);
  console.log(`Active orders expected: ${MANIFEST.expectedCounts.activeOrders}`);
  console.log("");

  if (args.verifyOnly) {
    await verify({ supabase, reporter });
    reporter.summary();
    reporter.assertNoConflicts();
    return;
  }

  const { hostelIds, facilityId } = await ensureHostelsAndFacility({
    supabase,
    reporter,
    args,
  });
  reporter.assertNoConflicts();

  const usersByEmail = await ensureAuthUsers({
    supabase,
    reporter,
    args,
    password: config.demoPassword,
  });
  reporter.assertNoConflicts();

  const profileIds = await ensureProfiles({
    supabase,
    reporter,
    args,
    usersByEmail,
    hostelIds,
    facilityId,
  });
  reporter.assertNoConflicts();

  const bagIds = await ensureBags({ supabase, reporter, args, profileIds });
  reporter.assertNoConflicts();

  await ensureOrders({
    supabase,
    reporter,
    args,
    hostelIds,
    facilityId,
    profileIds,
    bagIds,
  });

  reporter.summary();
  reporter.assertNoConflicts();
}

main().catch((error) => {
  console.error(`\nERROR: ${error.message}`);
  process.exit(1);
});
