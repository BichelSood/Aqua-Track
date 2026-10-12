#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const csvPath = path.join(
  projectRoot,
  "supabase",
  "local-test-roster.csv"
);

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EXPECTED_STUDENTS = 30;
const EXPECTED_STAFF = 4;

const ALLOWED_ROLES = new Set([
  "STUDENT",
  "DELIVERY_BOY",
  "WASHING_STAFF",
  "ADMIN",
]);

const ALLOWED_STATUSES = new Set([
  "",
  "SUBMITTED",
  "COLLECTED",
  "RECEIVED_AT_FACILITY",
  "UNDER_WASHING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERY_ATTEMPTED",
  "DELIVERED",
  "CANCELLED",
]);

const REQUIRED_COLUMNS = [
  "role",
  "hostel",
  "full_name",
  "email",
  "unique_id",
  "phone",
  "room",
  "bag_code",
  "qr_token",
  "laundry_status",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (quoted) {
    throw new Error("CSV has an unclosed quoted field.");
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));

    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  if (rows.length < 2) {
    throw new Error("CSV must contain a header and data rows.");
  }

  const headers = rows[0].map((header) =>
    header.trim().replace(/^\uFEFF/, "")
  );

  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !headers.includes(column)
  );

  if (missingColumns.length) {
    throw new Error(
      `Missing CSV columns: ${missingColumns.join(", ")}`
    );
  }

  return rows.slice(1).map((values, index) => {
    const record = {};

    headers.forEach((header, columnIndex) => {
      record[header] = (values[columnIndex] ?? "").trim();
    });

    record.__line = index + 2;
    return record;
  });
}

function checkUnique(rows, field, errors, options = {}) {
  const { ignoreBlank = true, lowercase = false } = options;
  const seen = new Map();

  for (const row of rows) {
    let value = row[field] ?? "";

    if (lowercase) {
      value = value.toLowerCase();
    }

    if (ignoreBlank && !value) {
      continue;
    }

    if (seen.has(value)) {
      errors.push(
        `Duplicate ${field} "${value}" on CSV lines ` +
        `${seen.get(value)} and ${row.__line}.`
      );
    } else {
      seen.set(value, row.__line);
    }
  }
}

function validateRoster(rows) {
  const errors = [];

  const students = rows.filter(
    (row) => row.role === "STUDENT"
  );

  const staff = rows.filter(
    (row) => row.role !== "STUDENT"
  );

  if (students.length !== EXPECTED_STUDENTS) {
    errors.push(
      `Expected ${EXPECTED_STUDENTS} students; found ${students.length}.`
    );
  }

  if (staff.length !== EXPECTED_STAFF) {
    errors.push(
      `Expected ${EXPECTED_STAFF} staff; found ${staff.length}.`
    );
  }

  for (const row of rows) {
    if (!ALLOWED_ROLES.has(row.role)) {
      errors.push(
        `Line ${row.__line}: invalid role "${row.role}".`
      );
    }

    if (!row.full_name) {
      errors.push(`Line ${row.__line}: full_name is blank.`);
    }

    if (
      !row.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)
    ) {
      errors.push(
        `Line ${row.__line}: email is missing or invalid.`
      );
    }

    if (!row.unique_id) {
      errors.push(
        `Line ${row.__line}: unique_id is blank.`
      );
    }

    if (
      row.role === "STUDENT" &&
      (!row.bag_code || !row.qr_token)
    ) {
      errors.push(
        `Line ${row.__line}: student requires bag_code and qr_token.`
      );
    }

    if (!ALLOWED_STATUSES.has(row.laundry_status)) {
      errors.push(
        `Line ${row.__line}: invalid laundry status ` +
        `"${row.laundry_status}".`
      );
    }
  }

  checkUnique(rows, "email", errors, {
    lowercase: true,
  });

  checkUnique(rows, "unique_id", errors);
  checkUnique(students, "bag_code", errors);
  checkUnique(students, "qr_token", errors);

  const hostelCounts = new Map();
  const statusCounts = new Map();

  for (const student of students) {
    const hostel = student.hostel || "(blank)";
    hostelCounts.set(
      hostel,
      (hostelCounts.get(hostel) ?? 0) + 1
    );

    const status =
      student.laundry_status || "(no active order)";

    statusCounts.set(
      status,
      (statusCounts.get(status) ?? 0) + 1
    );
  }

  return {
    errors,
    students,
    staff,
    hostelCounts,
    statusCounts,
  };
}

async function checkTable(table) {
  const endpoint =
    `${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}?select=*`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  const body = await response.text();

  if (!response.ok) {
    return {
      ok: false,
      table,
      status: response.status,
      detail: body.slice(0, 250),
    };
  }

  const contentRange = response.headers.get("content-range");
  const count = contentRange?.split("/").at(-1);

  return {
    ok: true,
    table,
    count:
      count && count !== "*"
        ? Number(count)
        : "reachable",
  };
}

async function main() {
  console.log("\nAqua Track — Hosted Seed Preflight");
  console.log("Mode: READ-ONLY (no database writes)\n");

  if (!fs.existsSync(csvPath)) {
    throw new Error(
      `Roster not found: ${csvPath}\n` +
      "Check that supabase/local-test-roster.csv exists."
    );
  }

  const csvText = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(csvText);
  const result = validateRoster(rows);

  console.log(
    `Roster: ${path.relative(projectRoot, csvPath)}`
  );
  console.log(`Total records: ${rows.length}`);
  console.log(`Students: ${result.students.length}`);
  console.log(`Staff: ${result.staff.length}`);

  console.log("\nStudents by hostel:");

  for (const [hostel, count] of result.hostelCounts) {
    console.log(`  ${hostel}: ${count}`);
  }

  console.log("\nLaundry statuses in roster:");

  for (const [status, count] of result.statusCounts) {
    console.log(`  ${status}: ${count}`);
  }

  if (result.errors.length) {
    console.error(
      `\nVALIDATION FAILED: ${result.errors.length} issue(s)`
    );

    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log("\nRoster validation: PASS");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.log("\nHosted API check: SKIPPED");
    console.log(
      "Load NEXT_PUBLIC_SUPABASE_URL and " +
      "SUPABASE_SERVICE_ROLE_KEY, then rerun."
    );
    console.log("No database changes were made.");
    return;
  }

  // Safety guard: only probe a standard hosted Supabase URL.
  if (
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(
      SUPABASE_URL
    )
  ) {
    throw new Error(
      "Safety stop: the Supabase URL is not a recognized " +
      "hosted project URL. No requests were made."
    );
  }

  const tables = [
    "profiles",
    "hostels",
    "facilities",
    "bags",
    "laundry_orders",
    "pickup_sessions",
    "washing_batches",
    "delivery_batches",
    "status_history",
  ];

  console.log("\nChecking hosted tables using GET requests...\n");

  let failures = 0;

  for (const table of tables) {
    try {
      const check = await checkTable(table);

      if (check.ok) {
        console.log(
          `PASS  ${check.table}: ${check.count} row(s)`
        );
      } else {
        failures++;
        console.log(
          `FAIL  ${check.table}: HTTP ${check.status} — ` +
          check.detail
        );
      }
    } catch (error) {
      failures++;
      console.log(`FAIL  ${table}: ${error.message}`);
    }
  }

  console.log("\n------------------------------------");

  if (failures > 0) {
    console.log(
      `Preflight FAILED: ${failures} hosted table check(s) failed.`
    );
    process.exitCode = 1;
  } else {
    console.log("Preflight PASSED.");
    console.log("Roster validation and table checks succeeded.");
    console.log(
      "No users or database records were created or changed."
    );
    console.log(
      "Next: review the hosted apply plan before enabling writes."
    );
  }
}

main().catch((error) => {
  console.error(`\nERROR: ${error.message}`);
  process.exitCode = 1;
});