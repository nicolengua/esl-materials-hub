// The brain: turn the four context layers into a request to Claude that returns
// the structured sections the renderer (lib/docx/renderer.js) draws.
//
// Four context layers (per the build brief):
//   1. The methodology — how Nick teaches (always included; §8 design tokens live
//      in the renderer, not here).
//   2. The matching L1 guide — only the one for this student's native language.
//   3. The student's history — what past sheets covered (for returning students).
//   4. This lesson's notes — today's class summary / structured intake.
//
// The model CHOOSES which section types fit this lesson and fills them in; the
// renderer decides how they look. Output is constrained to a JSON schema so the
// result is always parseable.

import Anthropic from "@anthropic-ai/sdk";
import { getContextDoc, l1KeyForLanguage } from "./db.js";

export const MODEL = "claude-opus-4-8";

// ---- The structured-output schema (mirrors the renderer's section contract) ----
// Every object sets additionalProperties:false (required by structured outputs).
const VOCAB_ITEM = {
  type: "object",
  additionalProperties: false,
  properties: {
    term: { type: "string" },
    pos: { type: "string", description: "part of speech, e.g. 'phrasal verb'" },
    definition: { type: "string" },
    examples: { type: "array", items: { type: "string" }, description: "two example sentences; wrap the target word in **double asterisks**" },
    l1Label: { type: "string", description: "the language's own name, e.g. Español, Русский, 中文" },
    l1: { type: "string", description: "the translation in the student's L1" },
    note: { type: "string", description: "context note: L1-interference flag, cognate trap, register, or why this word — omit if none" },
  },
  required: ["term", "definition", "examples"],
};

const SECTION = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["recap", "correction_grid", "callout", "grammar", "vocab", "homework"] },
    title: { type: "string" },
    intro: { type: "string", description: "short lead-in under the section header" },
    body: { type: "string", description: "paragraph text; separate paragraphs with a blank line" },
    variant: { type: "string", enum: ["amber", "teal"], description: "callout only; default amber" },
    rows: {
      type: "array",
      description: "correction_grid rows",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { you: { type: "string" }, instead: { type: "string" }, why: { type: "string" } },
        required: ["you", "instead", "why"],
      },
    },
    rule: { type: "string", description: "grammar: the rule in one plain-language sentence" },
    groups: {
      type: "object",
      additionalProperties: false,
      description: "grammar: an optional rule/verb-group table",
      properties: {
        headers: { type: "array", items: { type: "string" } },
        rows: { type: "array", items: { type: "array", items: { type: "string" } } },
      },
      required: ["headers", "rows"],
    },
    exercise: {
      type: "object",
      additionalProperties: false,
      description: "grammar: a varied exercise",
      properties: {
        instructions: { type: "string" },
        items: { type: "array", items: { type: "string" } },
      },
      required: ["items"],
    },
    answers: { type: "array", items: { type: "string" }, description: "grammar: answer key — include the reason for each" },
    items: { type: "array", items: VOCAB_ITEM, description: "vocab items" },
    tasks: { type: "array", items: { type: "string" }, description: "homework: this-week bullet tasks" },
  },
  required: ["type", "title"],
};

export const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    student: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        level: { type: "string", description: "e.g. B1" },
        date: { type: "string", description: "e.g. 2 June 2026" },
      },
      required: ["name"],
    },
    sections: { type: "array", items: SECTION },
  },
  required: ["student", "sections"],
};

// ---- Prompt assembly ----

const SYSTEM_INSTRUCTIONS = `You generate a post-class review sheet for Nick, an English coach. You write the CONTENT as structured sections; a separate program draws them into a Word document using a fixed design system, so you never describe fonts, colors, or layout — only content.

Follow the methodology below as your guide to voice, grammar approach, and what a good sheet contains. Design the sheet for THIS specific lesson: choose only the section types that serve this student today, in a sensible order, and leave out the rest. A typical sheet opens with a "recap" addressed to "you", then the sections the lesson calls for.

GROUNDING — THE MOST IMPORTANT RULE. Today's sheet is driven by TODAY'S CLASS NOTES: the corrections, vocabulary, grammar, pronunciation, and topics on the sheet are the ones that actually came up today. The methodology and L1 guide are background reference for HOW to teach and explain — not a syllabus. Never add a section, correction, or vocab item just because it is a common error, because the L1 guide mentions it, or to pad a thin lesson. If the notes say nothing about, say, articles (a/an/the), do not add an articles section — even for a Slavic-language speaker. When the notes are thin, make a shorter sheet.

USING HISTORY (specific, never vague). You MAY build on or reinforce a point from the RECORDED HISTORY when it genuinely connects to today — but only if you can name the specific past item accurately. If you reference earlier work, say exactly what it was ("the same depend on / depend of fix from a previous class"), and only when it really is in the recorded history. Never make vague or unverifiable continuity claims — no "we've fixed this before", "the job now is pure automaticity", "you keep doing this", "we've worked on this for weeks". If you can't point to the specific recorded item, don't imply any shared history at all.

NO MANUFACTURED CONNECTIONS. Do not tie a section (grammar, pronunciation, vocabulary, a reading, etc.) to an event, exam, goal, deadline, motivation, or earlier discussion unless that link is explicitly stated in today's notes or the recorded history. A section should stand on its own. For example, present a pronunciation list plainly — never invent a reason for it like "you asked for these again with the exam two weeks out". Include something because the lesson called for it, not because of a backstory you've supplied.

The section types you can emit (choose freely, repeat or omit as needed):
- recap: { title, body }. A warm, plain second-person summary of the class and what the sheet contains. Keep the body between 100 and 200 words.
- correction_grid: { title, intro?, rows:[{you, instead, why}] }. The workhorse: what the student said / what to say instead / why (tie the why to their L1). Lead with this when there are spoken errors.
- callout: { title, body, variant? }. A boxed note — three-way distinctions (watch/see/look at), heads-ups, or a weekly prompt. Default variant amber; use "teal" for a reference/quote card.
- grammar: { title, intro?, rule?, groups?:{headers,rows}, exercise?:{instructions,items}, answers? }. Start from the student's real errors. Name the concept in plain words first; vary the exercise answers; put the reason in each answer-key line.
- vocab: { title, items:[{term, pos, definition, examples(two), l1Label, l1, note?}] }. Two example sentences with the target word in **double asterisks**; label the translation in the language's own name; add a context note when one genuinely applies.
- homework: { title, body?, tasks:[] }. Close the loop — produce something to bring back; include a spoken recording when it fits.

Writing rules: warm, direct, plainspoken, specific to this student. Address them as "you". Avoid stock LLM phrasing. To bold a word inside any text (e.g. the target word in an example), wrap it in **double asterisks**.

Keep the teacher out of it; stay neutral by default. The sheet is for and about the student's English, not about Nick or the class dynamic — no personal observations like "I liked your observation" or "I was impressed", and don't retell the class as a story about the two of you. Default to a neutral, professional tone. Add a brief, genuine note of encouragement or motivation ONLY when today's notes indicate the student needs it (e.g. they were discouraged, lacked confidence, or felt frustrated). Otherwise, no pep talk — just the useful material.

Spelling: ALWAYS use American English spelling (behavior, color, organize, analyze, practicing, traveling, meter, center), never British (behaviour, colour, organise, etc.) — unless the lesson is specifically about American vs. British differences.

Links: whenever the lesson notes mention a specific resource with a link (a video, article, song, podcast, exercise), include that link as a clickable Markdown hyperlink — [descriptive title](https://the-actual-url) — placed inside the section that uses it. NEVER replace a link with a vague reference like "the video we talked about" or drop the URL; always carry the real URL through into the sheet. If the notes give a bare URL, give it a short descriptive title.

Don't assume this is a first class. Most students here have studied with Nick before. Only treat it as a first/initial class — and only then add a light forward-looking line in the recap — if the lesson notes clearly say so (e.g. "first class", "getting to know you"). If you have no history and the notes don't indicate a first class, just recap today's lesson normally without mentioning whether it's the first sheet.

Level/L1 mode: for low-level Spanish or Portuguese speakers, write instructions and explanations IN that language with the English embedded (the Oscar model). For other low levels, simple English with heavy L1-contrast notes. Intermediate and above: English, with targeted L1-interference notes. Use the L1 guide ONLY to explain the cause of errors the student actually made in the notes and to phrase L1-contrast notes for items already in the notes — never to decide what to teach.

Return ONLY a single JSON object — no markdown fences, no commentary before or after. The exact top-level shape is:
{ "student": { "name": string, "level": string, "date": string },
  "sections": [ { "type": one of the types above, "title": string, ...the fields for that type } ],
  "summary": string }
"summary" is a compact note (2-4 sentences) for the student's running record: what errors you corrected, what grammar you taught, what vocabulary you introduced, and any recurring themes — so future sheets build on this one instead of repeating it. Include only the fields that apply to each section's type. Do not invent a student first language line in the header.`;

function buildSystem(methodology, l1Guide, l1Language) {
  const blocks = [
    { type: "text", text: SYSTEM_INSTRUCTIONS },
    { type: "text", text: `# METHODOLOGY (how Nick teaches)\n\n${methodology}`, cache_control: { type: "ephemeral" } },
  ];
  if (l1Guide) {
    blocks.push({
      type: "text",
      text: `# L1 INTERFERENCE GUIDE — ${l1Language}\n(Use this to target the errors and contrasts most likely for this student.)\n\n${l1Guide}`,
      cache_control: { type: "ephemeral" },
    });
  }
  return blocks;
}

function studentProfile(student) {
  const f = [];
  const push = (label, v) => { if (v && String(v).trim()) f.push(`${label}: ${Array.isArray(v) ? v.join(", ") : v}`); };
  push("Name", student.name);
  push("Native language", student.nativeLanguage);
  push("Other languages", student.otherLanguages);
  push("Level", student.level);
  push("Job", student.job);
  push("Location", student.location);
  push("Interests", student.interests);
  push("Goals / English needs", student.englishNeeds);
  push("Exam", student.examType);
  push("Self-described", student.selfDescription);
  push("Strengths (teacher)", student.strengths);
  push("Recurring trouble spots (teacher)", student.troubleSpots);
  push("Personality / rapport", student.personality);
  push("Other notes", student.otherNotes);
  return f.join("\n");
}

function historyText(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "No prior sheets are recorded in this system for this student yet. This does NOT mean it's their first class — most students have studied with Nick before and received earlier sheets elsewhere. Do not say this is the first sheet or first class unless today's notes clearly indicate a first/initial class.";
  }
  const lines = history
    .map((h, i) => `Sheet ${i + 1}${h.date ? ` (${h.date})` : ""}: ${h.summary || JSON.stringify(h)}`)
    .join("\n");
  return `What earlier sheets covered. Use this so you don't needlessly re-explain things already taught, and so you can reinforce a specific past point when today's lesson genuinely connects to it — referencing the exact item, never with vague continuity claims. Today's notes still drive what's on the sheet.\n\n${lines}`;
}

function buildUser(student, classNotes, history) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return `# THIS STUDENT
${studentProfile(student)}

# RECORDED HISTORY (reference — see the "USING HISTORY" rule: build on specific items, never vague)
${historyText(history)}

# TODAY'S CLASS NOTES (what drives this sheet)
${classNotes}

# TASK
Design today's review sheet, driven by today's notes above. Today's date is ${dateStr}. Set student.date to that, and student.name and student.level from the profile. Choose the sections that fit this lesson and return the structured object.`;
}

// Generate the structured sheet (student + sections) for one lesson.
export async function generateSheet({ student, classNotes, history = [] }) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const client = new Anthropic({ apiKey });

  const methodology = await getContextDoc("methodology");
  const l1Key = l1KeyForLanguage(student.nativeLanguage);
  const l1Guide = l1Key ? await getContextDoc(l1Key) : "";

  const system = buildSystem(methodology, l1Guide, student.nativeLanguage);
  const messages = [{ role: "user", content: buildUser(student, classNotes, history) }];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system,
    messages,
  });

  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const parsed = parseSheetJson(text);
  if (!parsed) {
    throw new Error("The model did not return valid sheet data. Please try again.");
  }
  return { ...parsed, usage: response.usage };
}

// Pull a JSON object out of the model's text, tolerating stray fences/prose.
function parseSheetJson(text) {
  if (!text) return null;
  let s = text.trim();
  // strip ```json ... ``` fences if present
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(s);
  } catch {}
  // fall back to the outermost { ... }
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      return JSON.parse(s.slice(first, last + 1));
    } catch {}
  }
  return null;
}
