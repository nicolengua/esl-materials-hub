// One visual grammar for taught language, applied the same way on every sheet:
//   "Quotes" = the student's own words (the error being corrected) — "you said this"
//   Bold     = the target language (corrected forms, vocab headwords, taught phrases) — "learn this"
// The correction grid enforces the rule mechanically (here + in the renderer/preview)
// so it never depends on the model remembering it.

// Wrap the student's utterance in quotes, normalizing any quotes it came with.
export function quoteStudentWords(text) {
  const t = String(text || "").trim();
  if (!t) return t;
  const stripped = t.replace(/^["“]+/, "").replace(/["”]+$/, "");
  return `"${stripped}"`;
}
