import { buildSheetBuffer, sheetFilename } from "../../../lib/docx/renderer.js";
import { SAMPLE_STUDENT, SAMPLE_SECTIONS } from "../../../lib/docx/sample.js";

export const dynamic = "force-dynamic";

// GET /api/sample-docx -> downloads a sample .docx built from hand-written
// content, so we can check the renderer's look before connecting the AI.
export async function GET() {
  const buffer = await buildSheetBuffer({
    student: SAMPLE_STUDENT,
    sections: SAMPLE_SECTIONS,
  });
  const filename = sheetFilename(SAMPLE_STUDENT.name) + ".docx";
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
