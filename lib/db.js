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
