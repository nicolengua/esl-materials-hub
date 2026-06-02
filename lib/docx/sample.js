// Hand-written sample content used to test the renderer in isolation, BEFORE the
// AI is connected (Phase 2). Modeled on the Rita reference sheet so we can judge
// the look against a real example. This is the shape the AI will produce later.

export const SAMPLE_STUDENT = {
  name: "Rita",
  date: "29 May 2026",
  level: "B1",
};

export const SAMPLE_SECTIONS = [
  {
    type: "recap",
    title: "Today's class",
    body:
      "Since it was our first class, we spent most of it getting to know your background and what you want from English — your work in theater, the play you're writing with your coworker about your brother, and your plans for performing and writing in English.\n\nThis sheet collects the corrections and vocabulary from today, one grammar point worth getting precise, and your tasks for the week. We have several classes ahead, so this is the foundation we'll build on.",
  },
  {
    type: "correction_grid",
    title: "Your corrections from class",
    intro:
      "These came up in your speaking — most are common Spanish-speaker patterns, quick to fix once you can see them. Read across: what you said, what to say instead, and why.",
    rows: [
      { you: "I love write.", instead: "I love writing. / I love to write.", why: "After **love**, both forms are fine. But **enjoy** takes only ‑ing: I enjoy writing. (More in §4.)" },
      { you: "…for improve my English.", instead: "…to improve my English.", why: "Purpose = **to** + verb. Spanish “para mejorar” → “to improve,” never “for improve.”" },
      { you: "When I go to the school…", instead: "When I go to school…", why: "No “the” when it means the activity. I go to school = I study." },
      { you: "so far of my house", instead: "so far from my house", why: "“Far” pairs with **from**, not “of.”" },
      { you: "I have 24 years.", instead: "I am 24 years old.", why: "Age uses **be**, not “have.” Spanish “tengo 24 años” → “I am 24.”" },
    ],
  },
  {
    type: "callout",
    title: "watch vs. see vs. look at",
    body:
      "**look at** = point your eyes (look at this photo).\n\n**watch** = follow something that moves or changes (watch a play, watch TV).\n\n**see** = notice with your eyes, often without trying (I saw her at the theater) — also for films at the cinema (see a movie).",
  },
  {
    type: "grammar",
    title: "Grammar — which verbs take ‑ing, which take “to”",
    intro:
      "This caused two of your errors today (“I love write,” “for improve”), so it's worth a moment.",
    rule:
      "When one verb follows another, the second is either an ‑ing word (writing) or a “to” form (to write). English doesn't let you pick freely — each verb decides.",
    groups: {
      headers: ["Verb + ‑ing", "Verb + to", "Both (same meaning)"],
      rows: [
        ["enjoy, finish, avoid", "want, need, decide", "love, like"],
        ["practice, keep, suggest", "hope, plan, would like", "hate, prefer, start"],
      ],
    },
    exercise: {
      instructions: "Put the verb in the right form. (Answers vary; one item has two right answers — see if you can spot it.)",
      items: [
        "I enjoy ______ (write) poetry in three languages.",
        "She wants ______ (perform) her play in English someday.",
        "We finished ______ (rehearse) the first scene last night.",
        "I love ______ (act) — it's the best part of my week.",
        "I came to New York ______ (study) theater production.",
      ],
    },
    answers: [
      "writing — “enjoy” always takes ‑ing.",
      "to perform — “want” always takes “to.”",
      "rehearsing — “finish” always takes ‑ing.",
      "acting OR to act — “love” takes both. This is the one with two right answers.",
      "to study — here “to” means purpose (why you came).",
    ],
  },
  {
    type: "vocab",
    title: "Vocabulary from class",
    items: [
      {
        term: "to put on a play",
        pos: "phrase",
        definition: "To produce and perform a play for an audience.",
        examples: [
          "Her company is **putting on** a play about her brother's life.",
          "We **put on** a short play every spring at the community center.",
        ],
        l1Label: "Español",
        l1: "montar / poner en escena una obra",
      },
      {
        term: "to look into (something)",
        pos: "phrasal verb",
        definition: "To investigate or research something.",
        examples: [
          "I'll **look into** the university requirements this week.",
          "Can you **look into** why the papers are delayed?",
        ],
        l1Label: "Español",
        l1: "investigar, averiguar",
        note:
          "More natural in conversation than the cognate “investigate,” which Spanish speakers tend to over-use. Save “investigate” for formal or police/legal contexts.",
      },
    ],
  },
  {
    type: "homework",
    title: "This week",
    body:
      "Here's how we'll work between classes: you record a short voice memo — 1 to 5 minutes, no script, just talk — and send it to me. Speaking and then listening back lets you notice things you can't catch in the moment.",
    tasks: [
      "Record a 2–3 minute voice memo about the play you're writing and send it to me.",
      "Do the grammar exercise in §4; we'll check it together next class.",
      "Collect 3–5 useful phrases from anything you watch or read in English this week.",
    ],
  },
];
