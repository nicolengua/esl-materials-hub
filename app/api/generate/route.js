import { NextResponse } from "next/server";

async function callClaude(apiKey, system, userMessage, retriesLeft = 3) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  // Retry on overloaded (529) or server errors (500+)
  if (res.status >= 500 && retriesLeft > 0) {
    const wait = (4 - retriesLeft) * 3000; // 3s, 6s, 9s
    await new Promise((r) => setTimeout(r, wait));
    return callClaude(apiKey, system, userMessage, retriesLeft - 1);
  }

  return res;
}

export async function POST(request) {
  const { system, userMessage } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured. Set ANTHROPIC_API_KEY in your environment." },
      { status: 500 }
    );
  }

  try {
    const res = await callClaude(apiKey, system, userMessage);

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `API error: ${err}` }, { status: res.status });
    }

    const data = await res.json();
    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    // Strip markdown code fences if Claude wraps HTML in them
    const clean = text.replace(/^```html\s*\n?/, "").replace(/\n?```\s*$/, "");

    return NextResponse.json({ html: clean });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
