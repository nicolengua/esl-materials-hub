import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PARSE_SYSTEM, blankIntake } from "../../../lib/intake";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/parse-intake  body: { text }
// Sorts a pasted class summary into the structured intake fields.
export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Nothing to sort — paste a summary first." }, { status: 400 });
    }
    const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
    if (!apiKey) return NextResponse.json({ error: "API key not configured." }, { status: 500 });

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: PARSE_SYSTEM,
      messages: [{ role: "user", content: text }],
    });

    const out = response.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    let parsed = null;
    try {
      parsed = JSON.parse(out.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));
    } catch {
      const a = out.indexOf("{"), b = out.lastIndexOf("}");
      if (a !== -1 && b > a) { try { parsed = JSON.parse(out.slice(a, b + 1)); } catch {} }
    }
    if (!parsed) return NextResponse.json({ error: "Could not sort that text. Try again or fill the fields by hand." }, { status: 502 });

    // Only keep known string fields.
    const intake = blankIntake();
    for (const k of Object.keys(intake)) {
      if (typeof parsed[k] === "string") intake[k] = parsed[k];
    }
    return NextResponse.json({ intake });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
