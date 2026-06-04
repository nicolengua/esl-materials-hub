import { NextResponse } from "next/server";
import { ensureSchema, ensureContextSchema, getStudentRow } from "../../../lib/db";
import { generateSheet } from "../../../lib/generation";
import { formatIntake } from "../../../lib/intake";

export const dynamic = "force-dynamic";
// Generation with Opus + thinking can take a while — allow up to 5 minutes.
export const maxDuration = 300;

// POST /api/generate  body: { studentId, intake?, classNotes?, saveToHistory? }
// Loads the student + history, runs the four-layer generation, optionally appends
// a summary to the student's history, and returns { student, sections, summary }.
export async function POST(request) {
  try {
    await ensureSchema();
    await ensureContextSchema();
    const { studentId, intake, classNotes } = await request.json();

    const notes = intake ? formatIntake(intake) : (classNotes || "");
    if (!notes.trim()) {
      return NextResponse.json({ error: "Please fill in at least one field about today's class." }, { status: 400 });
    }
    const row = await getStudentRow(studentId);
    if (!row) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }
    const student = { ...row.data, id: row.id };
    // History is recorded on download, not here, so re-generating never writes phantom history.
    const sheet = await generateSheet({ student, classNotes: notes, history: row.history });
    return NextResponse.json({ student: sheet.student, sections: sheet.sections, summary: sheet.summary });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
