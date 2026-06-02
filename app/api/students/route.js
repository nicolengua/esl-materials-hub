import { NextResponse } from "next/server";
import { sql, ensureSchema } from "../../../lib/db";

// Read student records from the database. Always run on the server, never cached.
export const dynamic = "force-dynamic";

// GET /api/students  ->  { students: { id: {...fields}, ... } }
// Returns every student keyed by id, matching the shape the app used before.
export async function GET() {
  try {
    await ensureSchema();
    const rows = await sql`SELECT id, data FROM students ORDER BY name ASC`;
    const students = {};
    for (const row of rows) {
      students[row.id] = row.data;
    }
    return NextResponse.json({ students });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/students  body: { id, student }
// Creates or updates one student (an "upsert").
export async function POST(request) {
  try {
    await ensureSchema();
    const { id, student } = await request.json();
    if (!id || !student) {
      return NextResponse.json(
        { error: "Missing id or student" },
        { status: 400 }
      );
    }
    const name = (student.name || "").trim();
    await sql`
      INSERT INTO students (id, name, data, updated_at)
      VALUES (${id}, ${name}, ${JSON.stringify(student)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          data = EXCLUDED.data,
          updated_at = now()
    `;
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/students?id=...  -> removes one student.
export async function DELETE(request) {
  try {
    await ensureSchema();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await sql`DELETE FROM students WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
