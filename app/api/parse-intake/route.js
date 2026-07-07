import { NextResponse } from "next/server";
import { parseIntakeText } from "../../../lib/intake";

export const dynamic = "force-dynamic";

// POST /api/parse-intake  body: { text }
// Splits a pasted class summary into the intake fields by the recipe's seven
// literal section headers — no AI, so nothing is added, moved, or dropped.
export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Nothing to sort — paste a summary first." }, { status: 400 });
    }
    const { intake, notice } = parseIntakeText(text);
    return NextResponse.json({ intake, notice });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
