"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LEVELS, ENGLISH_NEEDS, DIFFICULTIES, LESSON_PREFS, PRACTICE_TIME,
  FEEDBACK_PREF, STRENGTHS, TROUBLE_SPOTS, L1_INTERFERENCE, PERSONALITY,
  RECORDING_CONSENT, blankStudent,
} from "../lib/constants";
import { buildPrompt, MATERIAL_TYPES } from "../lib/prompt";

// ─── Materials CSS (shared between preview and print) ─────────

const MATERIALS_CSS = `
  .materials-content { font-family: Georgia, "Times New Roman", serif; color: #222; line-height: 1.6; }
  .materials-content h1 { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 22px; color: #222; border-bottom: 2px solid #333; padding-bottom: 8px; margin: 0 0 4px 0; }
  .materials-content .doc-meta { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 13px; color: #666; margin-bottom: 28px; line-height: 1.5; }
  .materials-content h2 { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 17px; font-weight: 600; color: #333; margin: 0 0 12px 0; }
  .materials-content h3 { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #444; margin: 20px 0 8px 0; }
  .materials-content p { font-size: 14px; margin: 8px 0; }
  .materials-content li { font-size: 14px; margin: 4px 0; }
  .materials-content ol, .materials-content ul { margin-left: 20px; padding-left: 0; }
  .materials-content a { color: #2a5a8a; }

  .materials-content .section { margin-bottom: 32px; }

  .materials-content .vocab-box { border: 1px solid #d4d0c8; border-radius: 6px; background: #faf9f7; overflow: hidden; }
  .materials-content .vocab-item { padding: 14px 16px; border-bottom: 1px solid #e8e5df; }
  .materials-content .vocab-item:last-child { border-bottom: none; }
  .materials-content .vocab-term { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-weight: 700; font-size: 15px; color: #222; margin-bottom: 4px; }
  .materials-content .vocab-def { font-size: 13px; color: #444; margin-bottom: 6px; }
  .materials-content .vocab-example { font-size: 13px; color: #555; margin-bottom: 6px; padding-left: 12px; border-left: 2px solid #d4d0c8; }
  .materials-content .vocab-l1 { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 12px; color: #777; }
  .materials-content .vocab-note { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 12px; color: #996600; margin-top: 4px; font-style: italic; }

  .materials-content .reading-box { border: 1px solid #d4d0c8; border-radius: 6px; background: #faf9f7; padding: 20px; }
  .materials-content .reading-box p { font-size: 14px; margin: 0 0 12px 0; }
  .materials-content .reading-box p:last-child { margin-bottom: 0; }

  .materials-content .explain-box { border: 1px solid #b8cfe5; border-radius: 6px; background: #f0f5fa; padding: 16px 18px; margin-bottom: 20px; }
  .materials-content .explain-title { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-weight: 700; font-size: 14px; color: #2a5a8a; margin-bottom: 8px; }
  .materials-content .explain-box p { font-size: 14px; color: #333; }

  .materials-content .exercise-block { margin-bottom: 16px; }

  .materials-content .answer-key { margin-top: 28px; padding-top: 16px; border-top: 1px dashed #bbb; }
  .materials-content .answer-key h3 { color: #888; font-size: 14px; }
  .materials-content .answer-key p { font-size: 13px; color: #666; }
  .materials-content .answer-key ol { font-size: 13px; color: #666; }
`;

// ─── Tiny components ───────────────────────────────────────────

function TagSelect({ options, selected = [], onChange }) {
  const sel = Array.isArray(selected) ? selected : [];
  const toggle = (v) => {
    onChange(sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v]);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {(options || []).map((o) => (
        <span key={o} className={`tag ${sel.includes(o) ? "active" : ""}`} onClick={() => toggle(o)}>
          {o}
        </span>
      ))}
    </div>
  );
}

function RadioSelect({ options = [], value = "", onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {(options || []).map((o) => (
        <span key={o} className={`tag ${value === o ? "active" : ""}`} onClick={() => onChange(value === o ? "" : o)}>
          {o}
        </span>
      ))}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="form-section">
      <div className="section-title">{title}</div>
      {subtitle && <div className="section-subtitle">{subtitle}</div>}
      {!subtitle && <div style={{ height: 12 }} />}
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

// ─── LocalStorage helpers ──────────────────────────────────────

const STORAGE_KEY = "esl_hub_students";

function loadStudents() {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    // Merge each student with blankStudent defaults to fill missing fields
    const defaults = blankStudent();
    const safe = {};
    for (const [id, s] of Object.entries(raw)) {
      safe[id] = { ...defaults, ...s };
    }
    return safe;
  } catch {
    return {};
  }
}

function saveStudents(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Main App ──────────────────────────────────────────────────

export default function Home() {
  const [students, setStudents] = useState({});
  const [view, setView] = useState("list"); // list | form | generate | preview
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(blankStudent());
  const [genId, setGenId] = useState(null);
  const [classNotes, setClassNotes] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setStudents(loadStudents());
  }, []);

  const persist = useCallback((next) => {
    setStudents(next);
    saveStudents(next);
  }, []);

  // ─── Handlers ────────────────────────────────────────────────

  function openNewStudent() {
    setForm(blankStudent());
    setEditId(null);
    setView("form");
  }

  function openEditStudent(id) {
    setForm({ ...blankStudent(), ...students[id] });
    setEditId(id);
    setView("form");
  }

  function saveStudent() {
    if (!form.name.trim()) return;
    const id = editId || "s_" + Date.now();
    const next = { ...students, [id]: { ...form } };
    persist(next);
    setView("list");
  }

  function deleteStudent(id) {
    if (!confirm(`Delete ${students[id]?.name}?`)) return;
    const next = { ...students };
    delete next[id];
    persist(next);
  }

  function openGenerate(id) {
    setGenId(id);
    setClassNotes("");
    setSelectedMaterials(["Post-class summary", "Vocabulary — words & phrases"]);
    setGeneratedHtml("");
    setError("");
    setView("generate");
  }

  async function handleGenerate() {
    if (!classNotes.trim() || !selectedMaterials.length) return;
    setGenerating(true);
    setError("");
    setGeneratedHtml("");

    const student = students[genId];
    const { system, user } = buildPrompt(student, classNotes, selectedMaterials);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, userMessage: user }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setGeneratedHtml(data.html);
        setView("preview");
      }
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setGenerating(false);
    }
  }

  function handlePrint() {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    const day = String(now.getDate()).padStart(2, '0');
    const studentName = students[genId]?.name || 'Student';

    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Nick's Class ${monthName} ${day} - ${studentName}</title>
      <style>
        body { max-width: 720px; margin: 40px auto; padding: 0 24px; }
        ${MATERIALS_CSS}
        @media print { body { margin: 20px; } }
      </style>
    </head><body><div class="materials-content">${generatedHtml}</div></body></html>`);
    w.document.close();
    w.print();
  }

  // ─── Update helpers ──────────────────────────────────────────

  const updateField = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const onInput = (key) => (e) => updateField(key, e.target.value);

  // ─── Render ──────────────────────────────────────────────────

  const sorted = Object.entries(students).sort((a, b) => a[1].name.localeCompare(b[1].name));

  return (
    <div className="container">
      {/* Materials CSS for preview */}
      <style dangerouslySetInnerHTML={{ __html: MATERIALS_CSS }} />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
          ESL Materials Hub
        </h1>
        <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>
          {sorted.length} student{sorted.length !== 1 ? "s" : ""} ·{" "}
          <span style={{ cursor: "pointer", color: "var(--accent)", textDecoration: "underline" }} onClick={() => setView("list")}>
            Home
          </span>
        </p>
      </div>

      {/* ──── LIST VIEW ──── */}
      {view === "list" && (
        <div className="fade-in">
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={openNewStudent}>+ Add student</button>
          </div>
          {sorted.length === 0 && (
            <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-tertiary)" }}>
              No students yet. Add your first one above.
            </div>
          )}
          {sorted.length > 0 && (
            <div className="card">
              {sorted.map(([id, s]) => (
                <div key={id} className="student-row" onClick={() => openEditStudent(id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {s.name}
                      {s.level && <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", background: "var(--accent-light)", color: "var(--accent-dark)", borderRadius: 10 }}>{s.level}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                      {[s.nativeLanguage, s.job, ...(s.englishNeeds || []).slice(0, 2)].filter(Boolean).join(" · ") || "No details yet"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }} onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-xs" style={{ background: "var(--accent-light)", color: "var(--accent-dark)", borderColor: "var(--accent)" }} onClick={() => openGenerate(id)}>
                      Materials
                    </button>
                    <button className="btn btn-xs btn-secondary" onClick={() => openEditStudent(id)}>Edit</button>
                    <button className="btn btn-xs" style={{ color: "var(--danger)" }} onClick={() => deleteStudent(id)}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──── FORM VIEW ──── */}
      {view === "form" && (
        <div className="fade-in">
          <div className="card" style={{ overflow: "hidden" }}>
            <Section title="Basics">
              <Field label="Student name *">
                <input type="text" value={form.name} onChange={onInput("name")} placeholder="e.g. Felix" />
              </Field>
              <Field label="Native language">
                <input type="text" value={form.nativeLanguage} onChange={onInput("nativeLanguage")} placeholder="e.g. Spanish / Ukrainian / Korean" />
              </Field>
              <Field label="Other languages">
                <input type="text" value={form.otherLanguages} onChange={onInput("otherLanguages")} placeholder="e.g. French (B1), Portuguese (native)" />
              </Field>
              <Field label="Student self-description" >
                <textarea value={form.selfDescription} onChange={onInput("selfDescription")} placeholder="Paste anything the student told you about themselves, their goals, why they booked a class..." rows={3} />
              </Field>
              <Field label="Daily language environment">
                <input type="text" value={form.dailyLanguage} onChange={onInput("dailyLanguage")} placeholder="e.g. Lives in Germany, speaks English at work" />
              </Field>
              <Field label="Location">
                <input type="text" value={form.location} onChange={onInput("location")} placeholder="e.g. Kyiv, Ukraine" />
              </Field>
              <Field label="CEFR Level">
                <RadioSelect options={LEVELS} value={form.level} onChange={(v) => updateField("level", v)} />
              </Field>
            </Section>

            <Section title="Goals and context">
              <Field label="Job / profession">
                <input type="text" value={form.job} onChange={onInput("job")} placeholder="e.g. UX designer at a Berlin startup" />
              </Field>
              <Field label="How they use English at work">
                <input type="text" value={form.englishAtWork} onChange={onInput("englishAtWork")} placeholder="e.g. Daily standups, Slack, client demos" />
              </Field>
              <Field label="What they need English for">
                <TagSelect options={ENGLISH_NEEDS} selected={form.englishNeeds} onChange={(v) => updateField("englishNeeds", v)} />
              </Field>
              <Field label="Exam type (if applicable)">
                <input type="text" value={form.examType} onChange={onInput("examType")} placeholder="e.g. IELTS Academic, target 7.0" />
              </Field>
              <Field label="Urgency / timeline">
                <input type="text" value={form.urgency} onChange={onInput("urgency")} placeholder="e.g. Exam in 3 months / no deadline" />
              </Field>
              <Field label="Interests">
                <input type="text" value={form.interests} onChange={onInput("interests")} placeholder="e.g. Cooking, football, K-dramas, hiking" />
              </Field>
            </Section>

            <Section title="Self-reported challenges" subtitle="What the student says is hardest for them">
              <Field label="What's hardest?">
                <TagSelect options={DIFFICULTIES} selected={form.difficulties} onChange={(v) => updateField("difficulties", v)} />
              </Field>
            </Section>

            <Section title="Lesson and practice preferences">
              <Field label="What kind of lessons do they want?">
                <TagSelect options={LESSON_PREFS} selected={form.lessonPrefs} onChange={(v) => updateField("lessonPrefs", v)} />
              </Field>
              <Field label="Available practice time outside class">
                <RadioSelect options={PRACTICE_TIME} value={form.practiceTime} onChange={(v) => updateField("practiceTime", v)} />
              </Field>
              <Field label="Feedback preference">
                <RadioSelect options={FEEDBACK_PREF} value={form.feedbackPref} onChange={(v) => updateField("feedbackPref", v)} />
              </Field>
              <Field label="Recording consent">
                <RadioSelect options={RECORDING_CONSENT} value={form.recordingConsent} onChange={(v) => updateField("recordingConsent", v)} />
              </Field>
            </Section>

            <Section title="Teacher observations" subtitle="Fill what you know — update over time after classes">
              <Field label="Strengths">
                <TagSelect options={STRENGTHS} selected={form.strengths} onChange={(v) => updateField("strengths", v)} />
                <textarea value={form.strengthsOther} onChange={onInput("strengthsOther")} placeholder="Other strengths..." rows={2} style={{ marginTop: 8 }} />
              </Field>
              <Field label="Recurring trouble spots">
                <TagSelect options={TROUBLE_SPOTS} selected={form.troubleSpots} onChange={(v) => updateField("troubleSpots", v)} />
                <textarea value={form.troubleSpotsOther} onChange={onInput("troubleSpotsOther")} placeholder="Other trouble spots..." rows={2} style={{ marginTop: 8 }} />
              </Field>
              <Field label="L1 interference patterns">
                <TagSelect options={L1_INTERFERENCE} selected={form.l1Interference} onChange={(v) => updateField("l1Interference", v)} />
                <textarea value={form.l1InterferenceOther} onChange={onInput("l1InterferenceOther")} placeholder="Other L1 interference..." rows={2} style={{ marginTop: 8 }} />
              </Field>
              <Field label="Personality / rapport">
                <TagSelect options={PERSONALITY} selected={form.personality} onChange={(v) => updateField("personality", v)} />
                <textarea value={form.personalityOther} onChange={onInput("personalityOther")} placeholder="Other personality notes..." rows={2} style={{ marginTop: 8 }} />
              </Field>
            </Section>

            <Section title="Anything else">
              <Field label="Notes">
                <textarea value={form.otherNotes} onChange={onInput("otherNotes")} placeholder="Anything else worth noting..." rows={3} />
              </Field>
            </Section>

            <div style={{ padding: 20, display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={saveStudent}>{editId ? "Save changes" : "Add student"}</button>
              <button className="btn btn-secondary" onClick={() => setView("list")}>Cancel</button>
              {editId && (
                <button className="btn btn-danger" style={{ marginLeft: "auto" }} onClick={() => { deleteStudent(editId); setView("list"); }}>
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──── GENERATE VIEW ──── */}
      {view === "generate" && genId && students[genId] && (
        <div className="fade-in">
          <div className="card" style={{ overflow: "hidden" }}>
            <Section title={`Generate materials for ${students[genId].name}`} subtitle={`${students[genId].level || "Level TBD"} · ${students[genId].nativeLanguage || "L1 unknown"}`}>
              <Field label="Class notes from today *">
                <textarea
                  value={classNotes}
                  onChange={(e) => setClassNotes(e.target.value)}
                  rows={6}
                  placeholder={"Paste your class notes here. Include:\n- Topics discussed\n- Vocabulary that came up\n- Errors you noticed\n- What went well\n- Any homework discussed"}
                />
              </Field>
              <Field label="What to generate">
                <TagSelect options={MATERIAL_TYPES} selected={selectedMaterials} onChange={setSelectedMaterials} />
              </Field>
            </Section>

            <div style={{ padding: 20, display: "flex", gap: 10, alignItems: "center" }}>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={generating || !classNotes.trim() || !selectedMaterials.length}>
                {generating ? <><span className="spinner" /> Generating...</> : "Generate materials"}
              </button>
              <button className="btn btn-secondary" onClick={() => setView("list")}>Cancel</button>
              {error && <span style={{ color: "var(--danger)", fontSize: 13, marginLeft: 12 }}>{error}</span>}
            </div>
          </div>
        </div>
      )}

      {/* ──── PREVIEW VIEW ──── */}
      {view === "preview" && (
        <div className="fade-in">
          <div className="no-print" style={{ marginBottom: 16, display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={handlePrint}>Print / Save as PDF</button>
            <button className="btn btn-secondary" onClick={() => setView("generate")}>← Back to editor</button>
            <button className="btn btn-secondary" onClick={() => setView("list")}>Home</button>
          </div>
          <div className="card" style={{ padding: "32px 28px" }}>
            <div className="materials-content" dangerouslySetInnerHTML={{ __html: generatedHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}
