// Loads Nick's teaching IP into the private database (context_docs table):
//   - the methodology file, with §8 (design tokens) stripped out because those
//     live in the renderer, not the prompt
//   - one L1 interference guide per language
//
// The source files live in _reference/ (gitignored, never deployed). This script
// runs locally and pushes their contents into the DB, so the public repo never
// contains them. Safe to re-run — it upserts by key.
//
// Run with:  node --env-file=.env.local scripts/load-context.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const METHODOLOGY = "_reference/nicolengua-methodology.md";
const L1_DIR = "_reference/L1 Interference Guides";
const L1_FILES = {
  "l1:spanish": "Spanish .md",
  "l1:portuguese": "Brazilian Portuguese.md",
  "l1:italian": "Italian .md",
  "l1:mandarin": "Mandarin.md",
  "l1:russian-ukrainian": "Russian-Ukrainian.md",
};

// Remove the "## 8. Output format & design system" section (those tokens live in
// the renderer). Keep everything before it and resume at the next "## " heading.
function stripDesignSection(md) {
  const lines = md.split("\n");
  const out = [];
  let skipping = false;
  for (const line of lines) {
    if (/^##\s+8\.\s/.test(line)) { skipping = true; continue; }
    if (skipping && /^##\s+(?!8\.)/.test(line)) skipping = false; // next ## section
    if (!skipping) out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function main() {
  const conn = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!conn) throw new Error("No DATABASE_URL / POSTGRES_URL in environment.");
  const sql = neon(conn);

  await sql`
    CREATE TABLE IF NOT EXISTS context_docs (
      key        TEXT PRIMARY KEY,
      label      TEXT NOT NULL DEFAULT '',
      body       TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const docs = [];
  docs.push({
    key: "methodology",
    label: "Nicolengua methodology (teaching brain, §8 removed)",
    body: stripDesignSection(readFileSync(METHODOLOGY, "utf8")),
  });
  for (const [key, file] of Object.entries(L1_FILES)) {
    docs.push({
      key,
      label: file.replace(/\.md$/, "").trim() + " L1 guide",
      body: readFileSync(`${L1_DIR}/${file}`, "utf8"),
    });
  }

  for (const d of docs) {
    await sql`
      INSERT INTO context_docs (key, label, body, updated_at)
      VALUES (${d.key}, ${d.label}, ${d.body}, now())
      ON CONFLICT (key) DO UPDATE
      SET label = EXCLUDED.label, body = EXCLUDED.body, updated_at = now()
    `;
    console.log(`  ✓ ${d.key.padEnd(22)} ${d.body.length.toLocaleString()} chars  (${d.label})`);
  }
  console.log(`\nLoaded ${docs.length} context documents into the database.`);
}

main().catch((e) => {
  console.error("Load failed:", e.message);
  process.exit(1);
});
