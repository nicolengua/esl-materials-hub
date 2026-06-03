// Structured lesson intake (Phase 4). The generate screen collects these fields
// instead of one big notes box. A paste-parser can auto-fill them from a Granola
// summary. Both the field list (for the UI) and the formatting/ parsing helpers
// live here.

export const INTAKE_FIELDS = [
  { key: "lessonFocus", label: "Lesson focus", placeholder: "What today's class was mainly about", rows: 2 },
  { key: "speakingCorrections", label: "Speaking corrections", placeholder: "Things the student said and how to fix them (quote them if you can)", rows: 4 },
  { key: "languagePatterns", label: "Language patterns / grammar", placeholder: "Grammar points or patterns that came up", rows: 3 },
  { key: "vocabulary", label: "Vocabulary & phrases", placeholder: "New words, phrases, idioms — with any context", rows: 3 },
  { key: "homeworkTheme", label: "Homework theme", placeholder: "What you'd like the student to practice / record this week", rows: 2 },
  { key: "customElements", label: "Custom elements requested", placeholder: "Anything specific to include (a reading passage, a KPI tracker, a pronunciation table…)", rows: 2 },
  { key: "rawNotes", label: "Anything else (catch-all)", placeholder: "Paste or type anything else worth knowing for this sheet", rows: 4 },
];

export function blankIntake() {
  return Object.fromEntries(INTAKE_FIELDS.map((f) => [f.key, ""]));
}

export function intakeHasContent(intake) {
  return INTAKE_FIELDS.some((f) => (intake?.[f.key] || "").trim());
}

// Turn the structured intake into a labelled notes block for the generation prompt.
export function formatIntake(intake) {
  return INTAKE_FIELDS
    .filter((f) => (intake?.[f.key] || "").trim())
    .map((f) => `## ${f.label}\n${intake[f.key].trim()}`)
    .join("\n\n");
}

// System prompt for the paste-parser: sort a pasted class summary into the fields.
export const PARSE_SYSTEM = `You sort a teacher's pasted class summary (often a Granola meeting summary or a form response) into structured fields for an ESL lesson. Read the whole thing and distribute the content into these fields:

- lessonFocus: what the class was mainly about (1-2 lines)
- speakingCorrections: specific things the student said wrong and the fix; keep the student's own wording where present
- languagePatterns: grammar points or recurring patterns that came up
- vocabulary: words, phrases, idioms introduced (with any context/translation noted)
- homeworkTheme: anything about practice, recording, or homework for next time
- customElements: any specific material the teacher asked to include (reading passage, tracker, pronunciation table, etc.)
- rawNotes: anything useful that doesn't fit the fields above

Rules: don't invent content — only sort what's there. Leave a field as an empty string if nothing applies. Preserve concrete detail (quotes, names, examples). Return ONLY a JSON object with exactly those seven string keys, no markdown fences, no commentary.`;
