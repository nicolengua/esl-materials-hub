// One-time migration: load the 25 students from the backup file into the
// Neon Postgres database. Safe to re-run — it upserts by id, so running it
// twice will not create duplicates.
//
// Run with:  node --env-file=.env.local scripts/migrate-students.mjs
import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const BACKUP = "_reference/esl-hub-data-backup-2026-06-02.txt";

// The backup is an RTF file (despite the .txt name). Use macOS `textutil` to
// decode it reliably (handles accents, en-dashes, escaping), then parse.
function loadStudentsFromBackup() {
  const dir = mkdtempSync(join(tmpdir(), "eslmig-"));
  const rtfPath = join(dir, "backup.rtf");
  const txtPath = join(dir, "backup.txt");
  writeFileSync(rtfPath, readFileSync(BACKUP));
  execSync(`textutil -convert txt -output "${txtPath}" "${rtfPath}"`);
  const plain = readFileSync(txtPath, "utf8");
  const outer = JSON.parse(plain.slice(plain.indexOf("{")));
  return JSON.parse(outer.esl_hub_students); // { id: studentObj, ... }
}

async function main() {
  const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!conn) throw new Error("No DATABASE_URL / POSTGRES_URL in environment.");
  const sql = neon(conn);

  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL DEFAULT '',
      data       JSONB NOT NULL DEFAULT '{}'::jsonb,
      history    JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const students = loadStudentsFromBackup();
  const ids = Object.keys(students);
  console.log(`Found ${ids.length} students in the backup.`);

  let inserted = 0;
  for (const id of ids) {
    const student = students[id];
    const name = (student.name || "").trim();
    await sql`
      INSERT INTO students (id, name, data, updated_at)
      VALUES (${id}, ${name}, ${JSON.stringify(student)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          data = EXCLUDED.data,
          updated_at = now()
    `;
    inserted++;
    console.log(`  ✓ ${name || "(no name)"}`);
  }

  const [{ count }] = await sql`SELECT count(*)::int AS count FROM students`;
  console.log(`\nDone. Upserted ${inserted}. Total rows in database: ${count}.`);
}

main().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
