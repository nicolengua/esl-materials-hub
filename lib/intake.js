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

// ---- The paste-parser: a literal split on the recipe's seven headers ----
// No AI. Text between one recognized header and the next goes VERBATIM into that
// field — nothing summarized, reworded, dropped, or invented. Headers match at
// the start of a line, case-insensitive, optional colon, tolerant of markdown
// decoration ("## Lesson focus", "**Lesson focus:**"). Longer forms are listed
// first so "Anything else (catch-all)" wins over "Anything else".
const HEADER_PATTERNS = [
  { key: "lessonFocus", re: /^lesson focus/i },
  { key: "speakingCorrections", re: /^speaking corrections/i },
  { key: "languagePatterns", re: /^language patterns\s*\/\s*grammar/i },
  { key: "vocabulary", re: /^vocabulary\s*&\s*phrases/i },
  { key: "homeworkTheme", re: /^homework theme/i },
  { key: "customElements", re: /^custom elements requested/i },
  { key: "rawNotes", re: /^anything else(\s*\(catch-all\))?/i },
];

// Is this line one of the seven headers? Returns { key, rest } where rest is any
// same-line content after the colon ("Lesson focus: We covered modals"), or null.
function matchHeader(line) {
  const stripped = line.replace(/^[\s#>•\-–*]+/, "").trimEnd();
  for (const { key, re } of HEADER_PATTERNS) {
    const m = stripped.match(re);
    if (!m) continue;
    const rest = stripped.slice(m[0].length).replace(/^\*+/, "");
    if (rest === "") return { key, rest: "" };
    if (rest.startsWith(":")) return { key, rest: rest.slice(1).replace(/^\*+/, "").trim() };
    // "Lesson focus areas were…" — a sentence that starts like a header, not a header.
  }
  return null;
}

// Split a pasted summary into the intake fields. Returns { intake, notice }.
// If none of the seven headers is found, the whole paste lands in "Anything else"
// with a notice — never mangled, never an error.
export function parseIntakeText(text) {
  const intake = blankIntake();
  const src = String(text || "").replace(/\r\n?/g, "\n");
  const lines = src.split("\n");

  const hits = [];
  lines.forEach((line, i) => {
    const h = matchHeader(line);
    if (h) hits.push({ i, ...h });
  });

  if (hits.length === 0) {
    intake.rawNotes = src.trim();
    return {
      intake,
      notice: "Couldn't detect the standard sections — everything went into “Anything else (catch-all)”.",
    };
  }

  // The recipe puts its "REVIEW BEFORE PASTING" check block above the first
  // "Lesson focus" header; nothing above that header may enter any field.
  const firstFocus = hits.findIndex((h) => h.key === "lessonFocus");
  const used = hits.slice(firstFocus === -1 ? 0 : firstFocus);

  used.forEach((h, idx) => {
    const end = idx + 1 < used.length ? used[idx + 1].i : lines.length;
    const parts = lines.slice(h.i + 1, end);
    if (h.rest) parts.unshift(h.rest);
    const chunk = parts.join("\n").trim();
    if (!chunk) return; // header present but empty -> field stays empty
    intake[h.key] = intake[h.key] ? `${intake[h.key]}\n\n${chunk}` : chunk;
  });

  return { intake, notice: "" };
}
