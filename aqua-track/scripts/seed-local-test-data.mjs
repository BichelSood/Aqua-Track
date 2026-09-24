/**
 * Local-only Aqua Track test roster.
 * Creates hostels H1–H3, 10 students each, 2 delivery boys, bags, pickups,
 * and mixed laundry states for collection / washing / delivery scanning.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const PASSWORD = "DevPass123!";

const H1_NAMES = [
  "Aisha Rahman",
  "Kabir Sharma",
  "Meera Iyer",
  "Dev Patel",
  "Sana Khan",
  "Rohan Gupta",
  "Nisha Verma",
  "Aditya Joshi",
  "Priya Nair",
  "Vikram Rao",
];
const H2_NAMES = [
  "Ananya Das",
  "Farhan Ali",
  "Kavya Reddy",
  "Ishaan Malhotra",
  "Tara Singh",
  "Nikhil Bose",
  "Riya Kapoor",
  "Sameer Qureshi",
  "Diya Menon",
  "Arnav Pillai",
];
const H3_NAMES = [
  "Zara Hussain",
  "Kunal Mehta",
  "Lila Fernandes",
  "Harsh Vardhan",
  "Pooja Kulkarni",
  "Yash Banerjee",
  "Anika Chawla",
  "Rehan Sheikh",
  "Myra Dsouza",
  "Varun Krishnan",
];

const DELIVERY = [
  {
    email: "d1@aquatrack.local",
    fullName: "Suresh Kulkarni",
    staffId: "D-01",
    phone: "9888000001",
  },
  {
    email: "d2@aquatrack.local",
    fullName: "Manoj Bhat",
    staffId: "D-02",
    phone: "9888000002",
  },
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function studentsFor(hostelCode, names) {
  return names.map((fullName, index) => {
    const n = index + 1;
    return {
      email: `${hostelCode.toLowerCase()}.${pad(n)}@aquatrack.local`,
      fullName,
      hostelCode,
      rollNumber: `${hostelCode}-${String(n).padStart(3, "0")}`,
      bagCode: `BAG-${hostelCode}-${pad(n)}`,
      roomNumber: `${hostelCode}-${100 + n}`,
      phone: `90${hostelCode === "H1" ? "1" : hostelCode === "H2" ? "2" : "3"}${String(1000000 + n).slice(-7)}`,
    };
  });
}

const STUDENTS = [
  ...studentsFor("H1", H1_NAMES),
  ...studentsFor("H2", H2_NAMES),
  ...studentsFor("H3", H3_NAMES),
];

async function admin(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status} ${text}`);
  }
  return data;
}

async function listUsers() {
  const data = await admin("/auth/v1/admin/users?page=1&per_page=200");
  return data.users ?? [];
}

async function ensureUser(email, fullName) {
  const existing = (await listUsers()).find((user) => user.email === email);
  if (existing) {
    await admin(`/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      body: {
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      },
    });
    return existing.id;
  }

  const created = await admin("/auth/v1/admin/users", {
    method: "POST",
    body: {
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    },
  });
  return created.id;
}

function dockerBin() {
  const path = `${process.env.HOME}/.docker/bin:${process.env.HOME}/Applications/Docker.app/Contents/Resources/bin:/Applications/Docker.app/Contents/Resources/bin:${process.env.PATH}`;
  return execFileSync("bash", ["-lc", `PATH="${path}" command -v docker`], {
    encoding: "utf8",
  }).trim();
}

function psql(sql) {
  const bin = dockerBin();
  const cid = execFileSync(bin, ["ps", "-qf", "name=supabase_db_aqua-track"], {
    encoding: "utf8",
  }).trim();
  if (!cid) {
    throw new Error("Local supabase_db_aqua-track is not running.");
  }
  return execFileSync(
    bin,
    [
      "exec",
      "-i",
      cid,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: sql, encoding: "utf8" },
  );
}

const studentValues = STUDENTS.map(
  (s) =>
    `('${s.email.replaceAll("'", "''")}', '${s.fullName.replaceAll("'", "''")}', '${s.hostelCode}', '${s.rollNumber}', '${s.bagCode}', '${s.roomNumber}', '${s.phone}')`,
).join(",\n  ");

const sql = `
begin;

insert into public.hostels (name, code, address, is_active)
values
  ('Hostel H1', 'H1', 'North campus block H1', true),
  ('Hostel H2', 'H2', 'East campus block H2', true),
  ('Hostel H3', 'H3', 'South campus block H3', true)
on conflict (code) do update
set name = excluded.name,
    address = excluded.address,
    is_active = true,
    updated_at = now();

insert into public.facilities (name, code, address, is_active)
values (
  'Aqua Track Test Laundry Facility',
  'TEST-FACILITY',
  'Development Environment',
  true
)
on conflict (code) do update
set is_active = true, updated_at = now();

create temp table seed_students (
  email text primary key,
  full_name text not null,
  hostel_code text not null,
  roll_number text not null,
  bag_code text not null,
  room_number text not null,
  phone text not null
);

insert into seed_students (email, full_name, hostel_code, roll_number, bag_code, room_number, phone)
values
  ${studentValues};

update public.profiles p
set
  full_name = s.full_name,
  role = 'STUDENT',
  is_active = true,
  hostel_id = h.id,
  facility_id = null,
  roll_number = s.roll_number,
  room_number = s.room_number,
  phone = s.phone
from seed_students s
join auth.users u on u.email = s.email
join public.hostels h on h.code = s.hostel_code
where p.id = u.id;

update public.profiles p
set
  full_name = 'Suresh Kulkarni',
  role = 'DELIVERY_BOY',
  is_active = true,
  hostel_id = null,
  facility_id = null,
  roll_number = 'D-01',
  phone = '9888000001'
from auth.users u
where u.email = 'd1@aquatrack.local' and p.id = u.id;

update public.profiles p
set
  full_name = 'Manoj Bhat',
  role = 'DELIVERY_BOY',
  is_active = true,
  hostel_id = null,
  facility_id = null,
  roll_number = 'D-02',
  phone = '9888000002'
from auth.users u
where u.email = 'd2@aquatrack.local' and p.id = u.id;

update public.profiles p
set
  role = 'WASHING_STAFF',
  is_active = true,
  facility_id = (select id from public.facilities where code = 'TEST-FACILITY' limit 1)
from auth.users u
where u.email = 'washing@aquatrack.local' and p.id = u.id;

update public.profiles p
set role = 'ADMIN', is_active = true
from auth.users u
where u.email = 'admin@aquatrack.local' and p.id = u.id;

insert into public.bags (bag_code, qr_token, owner_id, is_active)
select
  s.bag_code,
  replace(gen_random_uuid()::text, '-', ''),
  u.id,
  true
from seed_students s
join auth.users u on u.email = s.email
on conflict (bag_code) do update
set owner_id = excluded.owner_id,
    is_active = true,
    updated_at = now();

delete from public.bags b
using auth.users u
join seed_students s on s.email = u.email
where b.owner_id = u.id
  and b.bag_code <> s.bag_code
  and not exists (
    select 1 from public.laundry_orders o where o.bag_id = b.id
  );

-- Replace today's seeded pickups for H1–H3 so the roster stays predictable.
delete from public.status_history
where laundry_order_id in (
  select o.id
  from public.laundry_orders o
  join public.pickup_sessions ps on ps.id = o.pickup_session_id
  join public.hostels h on h.id = ps.hostel_id
  where h.code in ('H1', 'H2', 'H3')
    and ps.scheduled_date = current_date
);

delete from public.notifications
where laundry_order_id in (
  select o.id
  from public.laundry_orders o
  join public.pickup_sessions ps on ps.id = o.pickup_session_id
  join public.hostels h on h.id = ps.hostel_id
  where h.code in ('H1', 'H2', 'H3')
    and ps.scheduled_date = current_date
);

delete from public.complaints
where laundry_order_id in (
  select o.id
  from public.laundry_orders o
  join public.pickup_sessions ps on ps.id = o.pickup_session_id
  join public.hostels h on h.id = ps.hostel_id
  where h.code in ('H1', 'H2', 'H3')
    and ps.scheduled_date = current_date
);

delete from public.messages
where laundry_order_id in (
  select o.id
  from public.laundry_orders o
  join public.pickup_sessions ps on ps.id = o.pickup_session_id
  join public.hostels h on h.id = ps.hostel_id
  where h.code in ('H1', 'H2', 'H3')
    and ps.scheduled_date = current_date
);

delete from public.laundry_orders
where pickup_session_id in (
  select ps.id
  from public.pickup_sessions ps
  join public.hostels h on h.id = ps.hostel_id
  where h.code in ('H1', 'H2', 'H3')
    and ps.scheduled_date = current_date
);

delete from public.washing_batches
where pickup_session_id in (
  select ps.id
  from public.pickup_sessions ps
  join public.hostels h on h.id = ps.hostel_id
  where h.code in ('H1', 'H2', 'H3')
    and ps.scheduled_date = current_date
);

delete from public.delivery_batches db
using public.hostels h
where db.hostel_id = h.id
  and h.code in ('H1', 'H2', 'H3')
  and db.batch_number like 'SEED-%';

delete from public.pickup_sessions ps
using public.hostels h
where ps.hostel_id = h.id
  and h.code in ('H1', 'H2', 'H3')
  and ps.scheduled_date = current_date;

insert into public.pickup_sessions (
  hostel_id,
  delivery_boy_id,
  scheduled_date,
  start_time,
  end_time,
  status,
  announced_at,
  started_at
)
select
  h.id,
  d.id,
  current_date,
  '09:00',
  '12:00',
  v.status::public.pickup_session_status,
  now(),
  case when v.status = 'ACTIVE' then now() else null end
from (
  values
    ('H1', 'd1@aquatrack.local', 'ANNOUNCED'),
    ('H2', 'd1@aquatrack.local', 'ACTIVE'),
    ('H3', 'd2@aquatrack.local', 'ACTIVE')
) as v(hostel_code, email, status)
join public.hostels h on h.code = v.hostel_code
join auth.users u on u.email = v.email
join public.profiles d on d.id = u.id;

insert into public.washing_batches (
  batch_number,
  pickup_session_id,
  facility_id,
  created_by,
  status
)
select
  'SEED-WB-' || h.code || '-' || to_char(current_date, 'YYYYMMDD'),
  ps.id,
  f.id,
  ps.delivery_boy_id,
  'CREATED'
from public.pickup_sessions ps
join public.hostels h on h.id = ps.hostel_id
join public.facilities f on f.code = 'TEST-FACILITY'
where h.code in ('H2', 'H3')
  and ps.scheduled_date = current_date;

-- H2: six collected bags for incoming/washing scans. Four bags stay free.
insert into public.laundry_orders (
  order_number,
  bag_id,
  student_id,
  pickup_session_id,
  status
)
select
  'SEED-H2-' || s.roll_number,
  b.id,
  p.id,
  ps.id,
  'COLLECTED'
from seed_students s
join auth.users u on u.email = s.email
join public.profiles p on p.id = u.id
join public.bags b on b.owner_id = p.id
join public.hostels h on h.code = 'H2'
join public.pickup_sessions ps
  on ps.hostel_id = h.id
 and ps.scheduled_date = current_date
where s.hostel_code = 'H2'
  and s.roll_number in ('H2-001', 'H2-002', 'H2-003', 'H2-004', 'H2-005', 'H2-006');

update public.laundry_orders o
set status = v.status::public.laundry_status
from (
  values
    ('SEED-H2-H2-001', 'COLLECTED'),
    ('SEED-H2-H2-002', 'COLLECTED'),
    ('SEED-H2-H2-003', 'RECEIVED_AT_FACILITY'),
    ('SEED-H2-H2-004', 'RECEIVED_AT_FACILITY'),
    ('SEED-H2-H2-005', 'UNDER_WASHING'),
    ('SEED-H2-H2-006', 'UNDER_WASHING')
) as v(order_number, status)
where o.order_number = v.order_number;

-- H3: delivery scanning. Bags already past wash.
insert into public.laundry_orders (
  order_number,
  bag_id,
  student_id,
  pickup_session_id,
  status
)
select
  'SEED-H3-' || s.roll_number,
  b.id,
  p.id,
  ps.id,
  'COLLECTED'
from seed_students s
join auth.users u on u.email = s.email
join public.profiles p on p.id = u.id
join public.bags b on b.owner_id = p.id
join public.hostels h on h.code = 'H3'
join public.pickup_sessions ps
  on ps.hostel_id = h.id
 and ps.scheduled_date = current_date
where s.hostel_code = 'H3';

insert into public.delivery_batches (
  batch_number,
  hostel_id,
  delivery_boy_id,
  status
)
select
  'SEED-DB-H3-' || to_char(current_date, 'YYYYMMDD'),
  h.id,
  d.id,
  'OUT_FOR_DELIVERY'
from public.hostels h
join auth.users u on u.email = 'd2@aquatrack.local'
join public.profiles d on d.id = u.id
where h.code = 'H3';

update public.laundry_orders o
set
  status = v.status::public.laundry_status,
  delivery_batch_id = case
    when v.status in ('OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPTED', 'DELIVERED')
      then db.id
    else null
  end,
  completed_at = case when v.status = 'DELIVERED' then now() else null end
from (
  values
    ('SEED-H3-H3-001', 'READY_FOR_DELIVERY'),
    ('SEED-H3-H3-002', 'READY_FOR_DELIVERY'),
    ('SEED-H3-H3-003', 'READY_FOR_DELIVERY'),
    ('SEED-H3-H3-004', 'READY_FOR_DELIVERY'),
    ('SEED-H3-H3-005', 'OUT_FOR_DELIVERY'),
    ('SEED-H3-H3-006', 'OUT_FOR_DELIVERY'),
    ('SEED-H3-H3-007', 'OUT_FOR_DELIVERY'),
    ('SEED-H3-H3-008', 'DELIVERY_ATTEMPTED'),
    ('SEED-H3-H3-009', 'DELIVERED'),
    ('SEED-H3-H3-010', 'DELIVERED')
) as v(order_number, status)
join public.delivery_batches db
  on db.batch_number = 'SEED-DB-H3-' || to_char(current_date, 'YYYYMMDD')
where o.order_number = v.order_number;

update public.washing_batches
set status = 'COMPLETED', received_at = now(), started_at = now(), completed_at = now()
where batch_number = 'SEED-WB-H3-' || to_char(current_date, 'YYYYMMDD');

insert into public.status_history (laundry_order_id, from_status, to_status, changed_by)
select
  o.id,
  null,
  o.status,
  o.student_id
from public.laundry_orders o
where o.order_number like 'SEED-%';

commit;
`;

const rosterSql = `
copy (
  select
    p.role,
    coalesce(h.code, '') as hostel,
    p.full_name,
    u.email,
    coalesce(p.roll_number, '') as unique_id,
    coalesce(p.phone, '') as phone,
    coalesce(p.room_number, '') as room,
    coalesce(b.bag_code, '') as bag_code,
    coalesce(b.qr_token, '') as qr_token,
    coalesce(o.status::text, '') as laundry_status
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.hostels h on h.id = p.hostel_id
  left join public.bags b on b.owner_id = p.id
  left join lateral (
    select status
    from public.laundry_orders
    where bag_id = b.id
      and status <> 'DELIVERED'
    order by created_at desc
    limit 1
  ) o on true
  where u.email in ('d1@aquatrack.local', 'd2@aquatrack.local', 'washing@aquatrack.local', 'admin@aquatrack.local')
     or u.email like 'h1.__@aquatrack.local'
     or u.email like 'h2.__@aquatrack.local'
     or u.email like 'h3.__@aquatrack.local'
  order by p.role, hostel, unique_id
) to stdout with csv header;
`;

const students = STUDENTS;

async function main() {
  console.log("Creating auth users…");
  for (const person of students) {
    await ensureUser(person.email, person.fullName);
  }
  for (const person of DELIVERY) {
    await ensureUser(person.email, person.fullName);
  }
  await ensureUser("washing@aquatrack.local", "Local Washing Staff");
  await ensureUser("admin@aquatrack.local", "Local Admin");

  console.log("Loading hostels, bags, pickups, and orders…");
  psql(sql);

  const csv = psql(rosterSql);
  const rosterPath = join(ROOT, "supabase/local-test-roster.csv");
  writeFileSync(rosterPath, csv);

  const rows = csv
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const cols = [];
      let current = "";
      let quoted = false;
      for (const char of line) {
        if (char === '"') {
          quoted = !quoted;
          continue;
        }
        if (char === "," && !quoted) {
          cols.push(current);
          current = "";
          continue;
        }
        current += char;
      }
      cols.push(current);
      return {
        role: cols[0],
        hostel: cols[1],
        name: cols[2],
        email: cols[3],
        uniqueId: cols[4],
        phone: cols[5],
        room: cols[6],
        bagCode: cols[7],
        qrToken: cols[8],
        laundryStatus: cols[9],
      };
    });

  const studentRows = rows.filter((row) => row.role === "STUDENT");
  const qrCards = studentRows
    .map(
      (row) => `
      <article>
        <img alt="QR ${row.bagCode}" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(row.qrToken)}" />
        <h2>${row.name}</h2>
        <p>${row.hostel} · ${row.uniqueId} · ${row.bagCode}</p>
        <p class="token">${row.qrToken}</p>
        <p>${row.laundryStatus || "no active order — collect"}</p>
      </article>`,
    )
    .join("\n");

  writeFileSync(
    join(ROOT, "supabase/local-test-qrs.html"),
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Aqua Track local QR sheet</title>
  <style>
    body { font-family: sans-serif; margin: 24px; }
    section { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    article { border: 1px solid #ddd; padding: 12px; text-align: center; }
    img { width: 180px; height: 180px; }
    .token { font-size: 11px; word-break: break-all; }
  </style>
</head>
<body>
  <h1>Local test QR codes</h1>
  <p>Password for every account: <strong>${PASSWORD}</strong>. Tokens are random hex, not names or roll numbers.</p>
  <section>${qrCards}</section>
</body>
</html>
`,
  );

  const mdLines = [
    "# Local test roster",
    "",
    `Password for every seeded account: \`${PASSWORD}\``,
    "",
    "Log in at http://localhost:3000/auth/login then log out to switch roles.",
    "",
    "## Staff",
    "",
    "| Role | Name | Unique id | Email | Home |",
    "|---|---|---|---|---|",
    "| Delivery | Suresh Kulkarni | D-01 | d1@aquatrack.local | /delivery/dashboard |",
    "| Delivery | Manoj Bhat | D-02 | d2@aquatrack.local | /delivery/dashboard |",
    "| Washing | Local Washing Staff | | washing@aquatrack.local | /washing/dashboard |",
    "| Admin | Local Admin | | admin@aquatrack.local | /admin/dashboard |",
    "",
    "## How to test scans",
    "",
    "1. **Collection (H1)** — log in as `d1@aquatrack.local`, start the H1 pickup, open `/delivery/scan`. Scan the QR (open `supabase/local-test-qrs.html`) or type the roll number / bag code. All 10 H1 bags have no active order.",
    "2. **Washing (H2)** — log in as `washing@aquatrack.local`, open `/washing/scan`. H2-001/002 collected, H2-003/004 at facility, H2-005/006 under washing. H2-007–010 are still free to collect if you start from delivery.",
    "3. **Delivery (H3)** — log in as `d2@aquatrack.local`, open `/delivery/scan`. H3-001–004 ready, H3-005–007 out for delivery, H3-008 attempted, H3-009/010 already delivered.",
    "4. **Wrong hostel** — scan an H3 QR while D-01’s H1 pickup is active; it should be rejected.",
    "",
    "## Students",
    "",
    "| Hostel | Name | Roll | Email | Room | Phone | Bag | QR token | Active status |",
    "|---|---|---|---|---|---|---|---|---|",
    ...studentRows.map(
      (row) =>
        `| ${row.hostel} | ${row.name} | ${row.uniqueId} | ${row.email} | ${row.room} | ${row.phone} | ${row.bagCode} | \`${row.qrToken}\` | ${row.laundryStatus || "none"} |`,
    ),
    "",
    "Machine-readable copy: `supabase/local-test-roster.csv`.",
    "",
  ];

  writeFileSync(join(ROOT, "supabase/local-test-roster.md"), mdLines.join("\n"));
  console.log(`Wrote ${rosterPath}`);
  console.log(`Students: ${studentRows.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
