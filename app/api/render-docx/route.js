import { buildSheetBuffer, sheetFilename } from "../../../lib/docx/renderer.js";
import { upsertHistoryForDate } from "../../../lib/db";

export const dynamic = "force-dynamic";

// POST /api/render-docx  body: { student, sections, summary?, studentId?, saveToHistory? }
// Draws an already-generated sheet into a downloadable Word document. Downloading
// is the "finalize" signal, so this is where the sheet is recorded to history
// (one entry per date) when saveToHistory is on.
export async function POST(request) {
  try {
    const { student = {}, sections = [], summary, studentId, saveToHistory = true } = await request.json();
    const buffer = await buildSheetBuffer({ student, sections });

    if (saveToHistory && studentId && summary && student.date) {
      try { await upsertHistoryForDate(studentId, student.date, summary); } catch {}
    }
    const filename = sheetFilename(student.name, student.date) + ".docx";
    const asciiName = filename.replace(/[^\x20-\x7E]/g, "_"); // plain fallback
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
