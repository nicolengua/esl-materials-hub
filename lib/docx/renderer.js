// The layout machine.
//
// The AI (later, Phase 3) returns a list of typed "sections". This file turns
// that list into a Word document, drawing each section type with the fixed
// design system in tokens.js. The AI chooses WHICH sections to emit and fills
// them in; this renderer decides how they LOOK. That split is what keeps every
// sheet visually consistent while letting the content flex per lesson.
//
// Section data contract (what each section object looks like):
//   { type: "recap",           title, body }
//   { type: "correction_grid", title, intro?, rows: [{ you, instead, why }] }
//   { type: "callout",         title?, body, variant?: "amber" | "teal" }
//   { type: "grammar",         title, intro?, rule?, groups?: { headers:[], rows:[[]] },
//                              exercise?: { instructions?, items:[] }, answers?: [] }
//   { type: "vocab",           title, items: [{ term, pos?, definition, examples:[],
//                              l1Label?, l1?, note? }] }
//   { type: "homework",        title, body?, tasks?: [] }
//
// In any text, wrap a phrase in **double asterisks** to bold it (used to
// highlight the target word inside an example sentence).

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  BorderStyle, WidthType, ShadingType, VerticalAlign,
} from "docx";
import { COLORS, FONT, SIZE, PAGE } from "./tokens.js";

// ---------- small text helpers ----------

// Split a string into runs, honoring **bold** markers.
function parseRuns(text, base = {}) {
  const parts = String(text ?? "").split(/(\*\*[^*]+\*\*)/g);
  return parts
    .filter((p) => p !== "")
    .map((p) =>
      p.startsWith("**") && p.endsWith("**")
        ? new TextRun({ ...base, text: p.slice(2, -2), bold: true })
        : new TextRun({ ...base, text: p })
    );
}

// A body paragraph (optionally styled). Splits on blank lines into separate paras.
function para(text, opts = {}) {
  const { spacing, ...runOpts } = opts;
  return new Paragraph({
    spacing: spacing ?? { after: 140, line: 288 },
    children: parseRuns(text, runOpts),
  });
}

function paragraphs(body, opts = {}) {
  return String(body ?? "")
    .split(/\n{2,}/)
    .map((chunk) => chunk.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .map((chunk) => para(chunk, opts));
}

function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 288 },
    children: parseRuns(text, opts),
  });
}

function numbered(text, ref, opts = {}) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80, line: 288 },
    children: parseRuns(text, opts),
  });
}

// The accent-colored numbered section header with a thin teal rule beneath.
function sectionHeader(n, title) {
  return new Paragraph({
    spacing: { before: 320, after: 140 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.accent, space: 4 },
    },
    children: [
      new TextRun({ text: `${n}.  ${title}`, bold: true, color: COLORS.accent, size: SIZE.sectionHead }),
    ],
  });
}

// The italic teal "rule" line that can sit under a header.
function ruleLine(text) {
  return new Paragraph({
    spacing: { after: 140 },
    children: [new TextRun({ text, italics: true, color: COLORS.accent, size: SIZE.rule })],
  });
}

// A single-cell boxed callout (amber by default, light-teal optional).
function calloutBox(childrenParas, variant = "amber") {
  const fill = variant === "teal" ? COLORS.accentLight : COLORS.amberBg;
  const borderColor = variant === "teal" ? COLORS.accent : COLORS.amberBorder;
  const edge = { style: BorderStyle.SINGLE, size: 8, color: borderColor };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: edge, bottom: edge, left: edge, right: edge, insideHorizontal: edge, insideVertical: edge },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: childrenParas,
          }),
        ],
      }),
    ],
  });
}

// ---------- section renderers (each returns an array of doc elements) ----------

function renderRecap(s, n) {
  return [sectionHeader(n, s.title || "Today's class"), ...paragraphs(s.body)];
}

function gridCell(text, { fill, color, italics, bold } = {}) {
  return new TableCell({
    shading: fill ? { fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.TOP,
    children: [
      new Paragraph({
        spacing: { after: 0, line: 276 },
        children: parseRuns(text, { color, italics, bold, size: SIZE.body }),
      }),
    ],
  });
}

function renderCorrectionGrid(s, n) {
  const thin = { style: BorderStyle.SINGLE, size: 4, color: "D8D8D8" };
  const out = [sectionHeader(n, s.title || "Your corrections from class")];
  if (s.intro) out.push(...paragraphs(s.intro));

  const header = new TableRow({
    tableHeader: true,
    children: [
      gridCell("You said", { fill: COLORS.gridRed, color: COLORS.white, bold: true }),
      gridCell("Say instead", { fill: COLORS.gridGreen, color: COLORS.white, bold: true }),
      gridCell("Why", { fill: COLORS.gridGray, color: COLORS.white, bold: true }),
    ],
  });

  const rows = (s.rows || []).map(
    (r) =>
      new TableRow({
        children: [
          gridCell(r.you, { color: COLORS.gridRed, italics: true }),
          gridCell(r.instead, { color: COLORS.gridGreen }),
          gridCell(r.why, { color: COLORS.body }),
        ],
      })
  );

  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [3000, 3000, 3360],
      borders: {
        top: thin, bottom: thin, left: thin, right: thin,
        insideHorizontal: thin, insideVertical: thin,
      },
      rows: [header, ...rows],
    })
  );
  return out;
}

function renderCallout(s, n) {
  const inner = [];
  if (s.title) {
    inner.push(
      new Paragraph({
        spacing: { after: s.body ? 80 : 0, line: 288 },
        children: [new TextRun({ text: s.title, bold: true, color: COLORS.accent, size: SIZE.body })],
      })
    );
  }
  inner.push(...paragraphs(s.body, { spacing: { after: 60, line: 288 } }));
  // A callout can be a numbered section (with a header) or a bare inline box.
  const box = calloutBox(inner, s.variant === "teal" ? "teal" : "amber");
  return n ? [sectionHeader(n, s.title || "Heads-up"), box] : [box];
}

function renderGrammar(s, n) {
  const out = [sectionHeader(n, s.title || "Grammar")];
  if (s.intro) out.push(...paragraphs(s.intro));
  if (s.rule) out.push(ruleLine(s.rule));

  if (s.groups && s.groups.headers) {
    const thin = { style: BorderStyle.SINGLE, size: 4, color: "D8D8D8" };
    const head = new TableRow({
      tableHeader: true,
      children: s.groups.headers.map((h) =>
        gridCell(h, { fill: COLORS.accentLight, color: COLORS.accent, bold: true })
      ),
    });
    const body = (s.groups.rows || []).map(
      (row) => new TableRow({ children: row.map((c) => gridCell(c, { color: COLORS.body })) })
    );
    out.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin },
        rows: [head, ...body],
      })
    );
  }

  if (s.exercise) {
    if (s.exercise.instructions) {
      out.push(
        new Paragraph({
          spacing: { before: 160, after: 80, line: 288 },
          children: [new TextRun({ text: s.exercise.instructions, italics: true, color: COLORS.gray, size: SIZE.body })],
        })
      );
    }
    (s.exercise.items || []).forEach((it) => out.push(numbered(it, "grammar-ex")));
  }

  if (s.answers && s.answers.length) {
    out.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [new TextRun({ text: "Answers — with the reason", bold: true, color: COLORS.gray, size: SIZE.small })],
      })
    );
    s.answers.forEach((a) => out.push(numbered(a, "grammar-ans", { color: COLORS.gray, size: SIZE.small })));
  }
  return out;
}

function renderVocab(s, n) {
  const out = [sectionHeader(n, s.title || "Vocabulary from class")];
  (s.items || []).forEach((item) => {
    // term (teal bold) + part of speech (gray)
    const termRuns = [new TextRun({ text: item.term, bold: true, color: COLORS.accent, size: SIZE.body })];
    if (item.pos) termRuns.push(new TextRun({ text: `   (${item.pos})`, italics: true, color: COLORS.gray, size: SIZE.small }));
    out.push(new Paragraph({ spacing: { before: 160, after: 40, line: 288 }, children: termRuns }));

    if (item.definition) out.push(para(item.definition));
    (item.examples || []).forEach((ex) =>
      out.push(
        new Paragraph({
          spacing: { after: 40, line: 288 },
          indent: { left: 240 },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLORS.accentLight, space: 8 } },
          children: parseRuns(ex, { color: COLORS.body }),
        })
      )
    );
    if (item.l1) {
      out.push(
        new Paragraph({
          spacing: { after: 40, line: 288 },
          children: [new TextRun({ text: `${item.l1Label ? item.l1Label + ": " : ""}${item.l1}`, color: COLORS.gray, size: SIZE.small })],
        })
      );
    }
    if (item.note) {
      out.push(calloutBox([new Paragraph({ spacing: { after: 0, line: 276 }, children: [
        new TextRun({ text: "Heads-up:  ", bold: true, color: COLORS.amberBorder, size: SIZE.small }),
        ...parseRuns(item.note, { color: COLORS.body, size: SIZE.small }),
      ] })], "amber"));
    }
  });
  return out;
}

function renderHomework(s, n) {
  const out = [sectionHeader(n, s.title || "This week")];
  if (s.body) out.push(...paragraphs(s.body));
  (s.tasks || []).forEach((t) => out.push(bullet(t)));
  return out;
}

const RENDERERS = {
  recap: renderRecap,
  correction_grid: renderCorrectionGrid,
  callout: renderCallout,
  grammar: renderGrammar,
  vocab: renderVocab,
  homework: renderHomework,
};

// ---------- header block + document assembly ----------

function headerBlock({ name, date, level }) {
  const metaBits = [];
  if (date) metaBits.push(date);
  if (level) metaBits.push(`Level: ${level}`);
  return [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: `Class Review — ${name || "Student"}`, bold: true, color: COLORS.accent, size: SIZE.title })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.accent, space: 6 } },
      children: [new TextRun({ text: metaBits.join("    ·    "), color: COLORS.gray, size: SIZE.small })],
    }),
  ];
}

// Build the docx Document from a student header + a list of sections.
export function buildSheet({ student = {}, sections = [] }) {
  const children = [...headerBlock(student)];
  let sectionNumber = 0;
  for (const s of sections) {
    const fn = RENDERERS[s.type];
    if (!fn) continue; // unknown section types are skipped, never crash
    // Inline callouts (no title) don't take a section number; everything else does.
    const takesNumber = !(s.type === "callout" && !s.title);
    const n = takesNumber ? ++sectionNumber : null;
    const els = fn(s, n);
    children.push(...els);
  }

  return new Document({
    styles: {
      default: { document: { run: { font: FONT, size: SIZE.body, color: COLORS.body } } },
    },
    numbering: {
      config: [
        { reference: "grammar-ex", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: "start" }] },
        { reference: "grammar-ans", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: "start" }] },
      ],
    },
    sections: [
      {
        properties: { page: { size: PAGE.size, margin: PAGE.margin } },
        children,
      },
    ],
  });
}

// Convenience: build + pack to a Buffer in one call.
export async function buildSheetBuffer(input) {
  const doc = buildSheet(input);
  return Packer.toBuffer(doc);
}

// The required filename: "Nick's Class [Month] DD - [Student Name]".
export function sheetFilename(name, date = new Date()) {
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = String(date.getDate()).padStart(2, "0");
  return `Nick's Class ${month} ${day} - ${name || "Student"}`;
}
