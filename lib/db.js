// Connection to the Neon Postgres database.
// Reads the connection string Vercel provides (DATABASE_URL).
import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "No database connection string found (DATABASE_URL / POSTGRES_URL)."
  );
}

export const sql = neon(connectionString);

// Creates the students table if it doesn't exist yet. Safe to call repeatedly.
export async function ensureSchema() {
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
}

// context_docs holds Nick's teaching IP — the methodology and the L1 guides —
// stored privately in the database (never in the public code repo). Keyed by:
//   "methodology"            -> the teaching brain (minus the §8 design tokens)
//   "l1:spanish" etc.        -> one L1 interference guide per language
export async function ensureContextSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS context_docs (
      key        TEXT PRIMARY KEY,
      label      TEXT NOT NULL DEFAULT '',
      body       TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

// Fetch one student's profile data + history by id. Returns null if missing.
export async function getStudentRow(id) {
  const rows = await sql`SELECT id, name, data, history FROM students WHERE id = ${id}`;
  if (!rows[0]) return null;
  return { id: rows[0].id, data: rows[0].data, history: rows[0].history || [] };
}

// Record a sheet in a student's history, keeping ONE entry per date: any existing
// entry for the same date is replaced. Called when a sheet is downloaded (finalized),
// so re-generating/iterating in the editor never piles up phantom history.
export async function upsertHistoryForDate(id, date, summary) {
  const entry = JSON.stringify([{ date, summary }]);
  await sql`
    UPDATE students
    SET history = COALESCE(
          (SELECT jsonb_agg(e)
             FROM jsonb_array_elements(COALESCE(history, '[]'::jsonb)) e
            WHERE e->>'date' IS DISTINCT FROM ${date}),
          '[]'::jsonb
        ) || ${entry}::jsonb,
        updated_at = now()
    WHERE id = ${id}
  `;
}

// Fetch one context document's body by key. Returns "" if missing.
// Outside production (preview deployments, local dev), a "<key>:draft" row wins
// when it exists — so methodology edits can be tested on the preview while the
// live app keeps reading the approved copy. Promote drafts with
// `scripts/load-context.mjs --promote` once approved.
export async function getContextDoc(key) {
  if (process.env.VERCEL_ENV !== "production") {
    const draft = await sql`SELECT body FROM context_docs WHERE key = ${key + ":draft"}`;
    if (draft[0]?.body) return draft[0].body;
  }
  const rows = await sql`SELECT body FROM context_docs WHERE key = ${key}`;
  return rows[0]?.body || "";
}

// Maps a student's stated native language to the matching L1 guide key,
// or null when no guide exists for that language (rely on general judgment).
export function l1KeyForLanguage(language) {
  const l = (language || "").toLowerCase();
  if (/spanish|español|castellano/.test(l)) return "l1:spanish";
  if (/portug/.test(l)) return "l1:portuguese";
  if (/italian|italiano/.test(l)) return "l1:italian";
  if (/mandarin|chinese|中文|putonghua/.test(l)) return "l1:mandarin";
  if (/russian|ukrain|русск|україн/.test(l)) return "l1:russian-ukrainian";
  return null;
}
