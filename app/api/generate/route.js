import { NextResponse } from "next/server";
import { ensureSchema, ensureContextSchema, getStudentRow } from "../../../lib/db";
import { generateSheet } from "../../../lib/generation";

export const dynamic = "force-dynamic";
// Generation with Opus + thinking can take a while — allow up to 5 minutes.
export const maxDuration = 300;

// POST /api/generate  body: { studentId, classNotes }
// Loads the student + history from the database, runs the four-layer generation,
// and returns the structured sheet { student, sections } for preview/rendering.
export async function POST(request) {
  try {
    await ensureSchema();
    await ensureContextSchema();
    const { studentId, classNotes } = await request.json();
    if (!classNotes || !classNotes.trim()) {
      return NextResponse.json({ error: "Class notes are required." }, { status: 400 });
    }
    const row = await getStudentRow(studentId);
    if (!row) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }
    const student = { ...row.data, id: row.id };
    const sheet = await generateSheet({ student, classNotes, history: row.history });
    return NextResponse.json({ student: sheet.student, sections: sheet.sections });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
