import { buildSheetBuffer, sheetFilename } from "../../../lib/docx/renderer.js";

export const dynamic = "force-dynamic";

// POST /api/render-docx  body: { student, sections }
// Draws an already-generated sheet into a downloadable Word document.
export async function POST(request) {
  try {
    const { student = {}, sections = [] } = await request.json();
    const buffer = await buildSheetBuffer({ student, sections });
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
