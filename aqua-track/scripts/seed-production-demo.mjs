/**
 * Aqua Track - production/demo test data seeder
 *
 * WARNING:
 * This script is intentionally destructive for the Supabase project it targets.
 * It removes all rows from the Aqua Track public tables and deletes all Supabase Auth users,
 * then recreates the complete demo roster.
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL=https://kaznvosxhkutzpppxtyn.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<Supabase secret/service-role key>
 *   SUPABASE_DB_PASSWORD=<database password>
 *
 * Run only against the disposable/demo production project.
 */

import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";

const API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const DB_HOST = "db.kaznvosxhkutzpppxtyn.supabase.co";
const PASSWORD = "DevPass123!";

if (!API || !SERVICE_ROLE || !DB_PASSWORD) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_DB_PASSWORD.",
  );
}

if (API !== "https://kaznvosxhkutzpppxtyn.supabase.co") {
  throw new Error(`Refusing to seed unexpected Supabase URL: ${API}`);
}

const supabase = createClient(API, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const H1_NAMES = [
  "Aisha Rahman", "Kabir Sharma", "Meera Iyer", "Dev Patel", "Sana Khan",
  "Rohan Gupta", "Nisha Verma", "Aditya Joshi", "Priya Nair", "Vikram Rao",
];
const H2_NAMES = [
  "Ananya Das", "Farhan Ali", "Kavya Reddy", "Ishaan Malhotra", "Tara Singh",
  "Nikhil Bose", "Riya Kapoor", "Sameer Qureshi", "Diya Menon", "Arnav Pillai",
];
const H3_NAMES = [
  "Zara Hussain", "Kunal Mehta", "Lila Fernandes", "Harsh Vardhan", "Pooja Kulkarni",
  "Yash Banerjee", "Anika Chawla", "Rehan Sheikh", "Myra Dsouza", "Varun Krishnan",
];

const QR_TOKENS = [
  "1ad4de5b147742edb1855169d9fff09c",
  "658c1c74e6cb426db5e32f74957f68c4",
  "c5094f85227d4349842674de921843ad",
  "d2280aebc90444efba787f6cd8da187a",
  "71e04991f54f40a4a2557cdd879e1c44",
  "b4534d19562141e486f31133234eb99f",
  "0ded2749eb204b2c8b7c3afb315e212d",
  "8112ba9d69294945b8b2e9c7c15d368c",
  "54701004dc194fbe9c5644ad965ebaf8",
  "a6e59c7477b04f739f75a924490ae37a",
  "9564613524504fde812f9e06dce9a841",
  "9de004384ee6417e848531548bd180c8",
  "376728e9441444f58718a0945f97a221",
  "d8990d1a6953448db69d2fac4dbfdd1a",
  "2fbfe709ee944bc69908c07b5e9e811c",
  "d183d7607a7d4d6eadc197c5f40dcc42",
  "43c6c23c744b45eab7e54a3989193473",
  "479d6f6987474fe0841beb3479a5b077",
  "e917f232cabf46139bb877321e544982",
  "4cfa2e5f61764955985ee99b555f5e87",
  "a7584295957b4894aa849fe37794a739",
  "5bc1fc7564d845809cb0285cbd487ecf",
  "d8b7b30d5a034acc812496f3a0d36336",
  "a1aab7da7f31483f8a763369340834ce",
  "93d46db7944e4f7785970340d92ade6e",
  "52cb2f8004844b8c9db420f57f5cbc10",
  "fe1b59d099684f6799946aa186b03657",
  "804942ffc6a04649a69389687ff4fd84",
  "defa791a70be4a7da3b46fc19d2354ce",
  "ed53d8689956475786e5911a4fbb7625",
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function studentsFor(hostelCode, names, hostelDigit) {
  return names.map((fullName, index) => {
    const n = index + 1;
    return {
      email: `${hostelCode.toLowerCase()}.${pad(n)}@aquatrack.local`,
      fullName,
      hostelCode,
      rollNumber: `${hostelCode}-${String(n).padStart(3, "0")}`,
      bagCode: `BAG-${hostelCode}-${pad(n)}`,
      roomNumber: `${hostelCode}-${100 + n}`,
      phone: `90${hostelDigit}${String(1000000 + n).slice(-7)}`,
      qrToken: QR_TOKENS[(hostelDigit - 1) * 10 + index],
    };
  });
}

const STUDENTS = [
  ...studentsFor("H1", H1_NAMES, 1),
  ...studentsFor("H2", H2_NAMES, 2),
  ...studentsFor("H3", H3_NAMES, 3),
];

const STAFF = [
  { email: "d1@aquatrack.local", fullName: "Suresh Kulkarni", role: "DELIVERY_BOY", rollNumber: "D-01", phone: "9888000001" },
  { email: "d2@aquatrack.local", fullName: "Manoj Bhat", role: "DELIVERY_BOY", rollNumber: "D-02", phone: "9888000002" },
  { email: "washing@aquatrack.local", fullName: "Local Washing Staff", role: "WASHING_STAFF" },
  { email: "admin@aquatrack.local", fullName: "Local Admin", role: "ADMIN" },
];

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if (!data.users || data.users.length < 1000) break;
    page += 1;
  }
  return users;
}

async function deleteAllAuthUsers() {
  const users = await listAllAuthUsers();
  console.log(`Deleting ${users.length} existing Auth users...`);
  for (const user of users) {
    const { error } = await supabase.auth.admin.deleteUser(user.id, true);
    if (error) throw new Error(`Could not delete ${user.email}: ${error.message}`);
  }
}

async function createUser(email, fullName) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`Could not create ${email}: ${error.message}`);
  return data.user.id;
}

async function withClient(fn) {
  const client = new Client({
    host: DB_HOST,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function resetPublicData(client) {
  console.log("Resetting Aqua Track public data...");
  await client.query(`
    TRUNCATE TABLE
      public.notifications,
      public.complaints,
      public.messages,
      public.status_history,
      public.laundry_orders,
      public.delivery_batches,
      public.washing_batches,
      public.pickup_sessions,
      public.bags,
      public.audit_logs,
      public.profiles,
      public.facilities,
      public.hostels
    RESTART IDENTITY CASCADE;
  `);
}

async function currentDate(client) {
  const result = await client.query(`SELECT to_char(CURRENT_DATE, 'YYYYMMDD') AS d`);
  return result.rows[0].d;
}

async function seedPublicData(client, byEmail) {
  await client.query("BEGIN");
  try {
    await client.query(`
      INSERT INTO public.hostels (name, code, address, is_active)
      VALUES
        ('Hostel H1', 'H1', 'North campus block H1', true),
        ('Hostel H2', 'H2', 'East campus block H2', true),
        ('Hostel H3', 'H3', 'South campus block H3', true);
    `);

    await client.query(`
      INSERT INTO public.facilities (name, code, address, is_active)
      VALUES ('Aqua Track Test Laundry Facility', 'TEST-FACILITY', 'Development Environment', true);
    `);

    const hostelRows = await client.query(`SELECT id, code FROM public.hostels`);
    const hostelIds = Object.fromEntries(hostelRows.rows.map((r) => [r.code, r.id]));
    const facility = (await client.query(
      `SELECT id FROM public.facilities WHERE code = 'TEST-FACILITY'`
    )).rows[0].id;

    for (const s of STUDENTS) {
      await client.query(`
        INSERT INTO public.profiles
          (id, full_name, role, is_active, hostel_id, facility_id, roll_number, room_number, phone)
        VALUES ($1, $2, 'STUDENT', true, $3, null, $4, $5, $6);
      `, [
        byEmail[s.email], s.fullName, hostelIds[s.hostelCode],
        s.rollNumber, s.roomNumber, s.phone,
      ]);
    }

    for (const s of STAFF) {
      await client.query(`
        INSERT INTO public.profiles
          (id, full_name, role, is_active, hostel_id, facility_id, roll_number, phone)
        VALUES ($1, $2, $3, true, null, $4, $5, $6);
      `, [
        byEmail[s.email], s.fullName,
        s.role === "WASHING_STAFF" ? facility : null,
        s.rollNumber ?? null, s.phone ?? null,
      ]);
    }

    for (const s of STUDENTS) {
      await client.query(`
        INSERT INTO public.bags (bag_code, qr_token, owner_id, is_active)
        VALUES ($1, $2, $3, true);
      `, [s.bagCode, s.qrToken, byEmail[s.email]]);
    }

    const d1 = byEmail["d1@aquatrack.local"];
    const d2 = byEmail["d2@aquatrack.local"];

    const pickupIds = {};
    for (const [hostelCode, deliveryId, status] of [
      ["H1", d1, "ANNOUNCED"],
      ["H2", d1, "ACTIVE"],
      ["H3", d2, "ACTIVE"],
    ]) {
      const result = await client.query(`
        INSERT INTO public.pickup_sessions
          (hostel_id, delivery_boy_id, scheduled_date, start_time, end_time, status, announced_at, started_at)
        VALUES ($1, $2, CURRENT_DATE, '09:00', '12:00', $3::public.pickup_session_status, now(),
                CASE WHEN $3 = 'ACTIVE' THEN now() ELSE null END)
        RETURNING id;
      `, [hostelIds[hostelCode], deliveryId, status]);
      pickupIds[hostelCode] = result.rows[0].id;
    }

    for (const hostelCode of ["H2", "H3"]) {
      await client.query(`
        INSERT INTO public.washing_batches
          (batch_number, pickup_session_id, facility_id, created_by, status)
        VALUES ($1, $2, $3, $4, 'CREATED');
      `, [
        `SEED-WB-${hostelCode}-` + await currentDate(client),
        pickupIds[hostelCode],
        facility,
        hostelCode === "H2" ? d1 : d2,
      ]);
    }

    const bagRows = await client.query(`SELECT id, bag_code FROM public.bags`);
    const bagByCode = Object.fromEntries(bagRows.rows.map((r) => [r.bag_code, r.id]));
    const studentByRoll = Object.fromEntries(STUDENTS.map((s) => [s.rollNumber, s]));

    for (const roll of ["H2-001","H2-002","H2-003","H2-004","H2-005","H2-006"]) {
      const s = studentByRoll[roll];
      await client.query(`
        INSERT INTO public.laundry_orders
          (order_number, bag_id, student_id, pickup_session_id, status)
        VALUES ($1, $2, $3, $4, 'COLLECTED');
      `, [`SEED-H2-${roll}`, bagByCode[s.bagCode], byEmail[s.email], pickupIds.H2]);
    }

    for (const [roll, status] of [
      ["H2-001", "COLLECTED"],
      ["H2-002", "COLLECTED"],
      ["H2-003", "RECEIVED_AT_FACILITY"],
      ["H2-004", "RECEIVED_AT_FACILITY"],
      ["H2-005", "UNDER_WASHING"],
      ["H2-006", "UNDER_WASHING"],
    ]) {
      await client.query(
        `UPDATE public.laundry_orders SET status = $1::public.laundry_status WHERE order_number = $2`,
        [status, `SEED-H2-${roll}`],
      );
    }

    for (const s of STUDENTS.filter((x) => x.hostelCode === "H3")) {
      await client.query(`
        INSERT INTO public.laundry_orders
          (order_number, bag_id, student_id, pickup_session_id, status)
        VALUES ($1, $2, $3, $4, 'COLLECTED');
      `, [
        `SEED-H3-${s.rollNumber}`,
        bagByCode[s.bagCode],
        byEmail[s.email],
        pickupIds.H3,
      ]);
    }

    const today = await currentDate(client);
    const deliveryBatch = await client.query(`
      INSERT INTO public.delivery_batches
        (batch_number, hostel_id, delivery_boy_id, status)
      VALUES ($1, $2, $3, 'OUT_FOR_DELIVERY')
      RETURNING id;
    `, [`SEED-DB-H3-${today}`, hostelIds.H3, d2]);

    const deliveryBatchId = deliveryBatch.rows[0].id;

    for (const [roll, status] of [
      ["H3-001", "READY_FOR_DELIVERY"],
      ["H3-002", "READY_FOR_DELIVERY"],
      ["H3-003", "READY_FOR_DELIVERY"],
      ["H3-004", "READY_FOR_DELIVERY"],
      ["H3-005", "OUT_FOR_DELIVERY"],
      ["H3-006", "OUT_FOR_DELIVERY"],
      ["H3-007", "OUT_FOR_DELIVERY"],
      ["H3-008", "DELIVERY_ATTEMPTED"],
      ["H3-009", "DELIVERED"],
      ["H3-010", "DELIVERED"],
    ]) {
      await client.query(`
        UPDATE public.laundry_orders
        SET status = $1::public.laundry_status,
            delivery_batch_id = CASE
              WHEN $1 IN ('OUT_FOR_DELIVERY','DELIVERY_ATTEMPTED','DELIVERED')
              THEN $2 ELSE null END,
            completed_at = CASE WHEN $1 = 'DELIVERED' THEN now() ELSE null END
        WHERE order_number = $3;
      `, [status, deliveryBatchId, `SEED-H3-${roll}`]);
    }

    await client.query(`
      UPDATE public.washing_batches
      SET status = 'COMPLETED', received_at = now(), started_at = now(), completed_at = now()
      WHERE batch_number = $1;
    `, [`SEED-WB-H3-${today}`]);

    await client.query(`
      INSERT INTO public.status_history (laundry_order_id, from_status, to_status, changed_by)
      SELECT id, null, status, student_id
      FROM public.laundry_orders
      WHERE order_number LIKE 'SEED-%';
    `);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  console.log("Aqua Track production demo seed");
  console.log("Target:", API);
  console.log("DESTRUCTIVE: existing Aqua Track public data and Auth users will be replaced.");

  await withClient(resetPublicData);
  await deleteAllAuthUsers();

  const byEmail = {};

  console.log("Creating 34 demo Auth users...");
  for (const s of STUDENTS) {
    byEmail[s.email] = await createUser(s.email, s.fullName);
  }
  for (const s of STAFF) {
    byEmail[s.email] = await createUser(s.email, s.fullName);
  }

  console.log("Creating profiles, bags, pickups, batches and orders...");
  await withClient((client) => seedPublicData(client, byEmail));

  console.log("");
  console.log("========================================");
  console.log("Aqua Track demo data is READY.");
  console.log("========================================");
  console.log("Students: 30");
  console.log("Delivery boys: 2");
  console.log("Washing staff: 1");
  console.log("Admin: 1");
  console.log("Bags: 30");
  console.log("Password for every seeded account: DevPass123!");
  console.log("");
  console.log("Staff:");
  console.log("  admin@aquatrack.local");
  console.log("  washing@aquatrack.local");
  console.log("  d1@aquatrack.local");
  console.log("  d2@aquatrack.local");
}

main().catch((error) => {
  console.error("");
  console.error("SEED FAILED");
  console.error(error);
  process.exit(1);
});

