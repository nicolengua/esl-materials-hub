// A lightweight on-screen preview of a generated sheet. This is ONLY for quick
// viewing in the app while calibrating — the real, formatted output is the Word
// document from the renderer. Kept deliberately simple.

import { quoteStudentWords } from "./format.js";

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// **bold** -> <strong>, [title](url) and bare URLs -> links, after escaping.
const fmt = (s) =>
  esc(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" style="color:#0F7A63">$1</a>')
    .replace(/(^|[^"=])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" style="color:#0F7A63">$2</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

const paras = (body) =>
  String(body ?? "")
    .split(/\n{2,}/)
    .map((p) => `<p>${fmt(p.replace(/\n/g, " ").trim())}</p>`)
    .join("");

function sectionHtml(s, n) {
  const head = `<h2 style="color:#0F7A63;border-bottom:1px solid #0F7A63;padding-bottom:4px">${n}. ${esc(s.title || "")}</h2>`;
  switch (s.type) {
    case "recap":
      return head + paras(s.body);
    case "correction_grid": {
      const rows = (s.rows || [])
        .map(
          (r) =>
            `<tr><td style="color:#B23A48;font-style:italic">${fmt(quoteStudentWords(r.you))}</td><td style="color:#147A52;font-weight:bold">${fmt(r.instead)}</td><td>${fmt(r.why)}</td></tr>`
        )
        .join("");
      return (
        head +
        (s.intro ? paras(s.intro) : "") +
        `<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><th style="background:#B23A48;color:#fff">You said</th><th style="background:#147A52;color:#fff">Say instead</th><th style="background:#6A6A6A;color:#fff">Why</th></tr>${rows}</table>`
      );
    }
    case "callout":
      return (
        head +
        `<div style="background:${s.variant === "teal" ? "#E4F3EE" : "#FBEFD7"};border:1px solid ${s.variant === "teal" ? "#0F7A63" : "#E0A53B"};padding:12px;border-radius:6px">${paras(s.body)}</div>`
      );
    case "grammar": {
      let h = head + (s.intro ? paras(s.intro) : "");
      if (s.rule) h += `<p style="color:#0F7A63;font-style:italic">${fmt(s.rule)}</p>`;
      if (s.groups?.headers) {
        const th = s.groups.headers.map((x) => `<th style="background:#E4F3EE;color:#0F7A63">${esc(x)}</th>`).join("");
        const tr = (s.groups.rows || []).map((row) => `<tr>${row.map((c) => `<td>${fmt(c)}</td>`).join("")}</tr>`).join("");
        h += `<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr>${th}</tr>${tr}</table>`;
      }
      if (s.exercise) {
        if (s.exercise.instructions) h += `<p style="color:#6A6A6A;font-style:italic">${fmt(s.exercise.instructions)}</p>`;
        h += `<ol>${(s.exercise.items || []).map((i) => `<li>${fmt(i)}</li>`).join("")}</ol>`;
      }
      if (s.answers?.length) h += `<p style="color:#6A6A6A"><strong>Answers</strong></p><ol>${s.answers.map((a) => `<li style="color:#6A6A6A">${fmt(a)}</li>`).join("")}</ol>`;
      return h;
    }
    case "vocab":
      return (
        head +
        (s.items || [])
          .map(
            (it) =>
              `<div style="margin:10px 0"><div><strong style="color:#0F7A63">${esc(it.term)}</strong> ${it.pos ? `<em style="color:#6A6A6A">(${esc(it.pos)})</em>` : ""}</div>` +
              (it.definition ? `<p>${fmt(it.definition)}</p>` : "") +
              (it.examples || []).map((ex) => `<p style="border-left:3px solid #E4F3EE;padding-left:8px">${fmt(ex)}</p>`).join("") +
              (it.l1 ? `<div style="color:#6A6A6A;font-size:13px">${esc(it.l1Label ? it.l1Label + ": " : "")}${esc(it.l1)}</div>` : "") +
              (it.note ? `<div style="background:#FBEFD7;border:1px solid #E0A53B;padding:8px;border-radius:6px;font-size:13px"><strong>Note:</strong> ${fmt(it.note)}</div>` : "") +
              `</div>`
          )
          .join("")
      );
    case "homework":
      return head + (s.body ? paras(s.body) : "") + `<ul>${(s.tasks || []).map((t) => `<li>${fmt(t)}</li>`).join("")}</ul>`;
    default:
      return head;
  }
}

export function sheetToHtml(sheet) {
  if (!sheet || !sheet.sections) return "";
  const st = sheet.student || {};
  const meta = [st.date, st.level ? `Level: ${st.level}` : ""].filter(Boolean).join("  ·  ");
  let n = 0;
  const body = sheet.sections
    .map((s) => sectionHtml(s, (s.type === "callout" && !s.title) ? n : ++n))
    .join("");
  return (
    `<h1 style="color:#0F7A63">Class Review — ${esc(st.name || "Student")}</h1>` +
    `<div class="doc-meta">${esc(meta)}</div>` +
    body
  );
}
