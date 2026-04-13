// ─── Constants matching Google Form: "Nick's English Classes" ───

export const DAILY_LANGUAGE = [
  "Mostly my native language",
  "A mix of my native language and English",
  "Mostly English",
  "A mix of English and another language (not my native language)",
  "Mostly another language (not English or my native language)",
];

export const ENGLISH_NEEDS = [
  "Work: meetings / updates",
  "Work: calls / video calls",
  "Work: emails / chat (Slack/Teams)",
  "Work: presentations",
  "Work: job interviews",
  "Study: classes/lectures",
  "Study: writing (essays/reports)",
  "Daily life: conversations/making friends",
  "Travel/practical tasks",
  "Test preparation",
];

export const URGENCY = [
  "This week",
  "In the next 2–4 weeks",
  "In the next 1–3 months",
  "In the next 3–6 months",
  "In the next year",
  "No deadline/general improvement",
];

export const EXAM_TYPES = [
  "IELTS",
  "TOEFL",
  "Cambridge",
  "Duolingo",
  "CELPIP",
];

export const SPEAKS_TO = [
  "Coworkers/team",
  "Manager/boss",
  "Clients/customers",
  "Teachers/classmates",
  "Partner (husband/wife/boyfriend/girlfriend)",
  "My children",
  "Friends/social situations",
  "Strangers (services, travel, etc.)",
  "Mostly nobody (yet)",
];

export const COMMUNICATION_WHERE = [
  "In person",
  "Phone calls",
  "Video calls",
  "Email",
  "Chat messages (Slack/WhatsApp/etc.)",
  "Presentations to a group",
];

export const DIFFICULTIES = [
  "Finding words fast enough",
  "Organizing what I want to say",
  "Grammar mistakes",
  "Sounding natural/\"like a native\"",
  "Understanding fast speech",
  "Pronunciation/being understood",
  "Confidence/anxiety",
  "Writing clearly (tone, politeness, clarity)",
];

export const ENGLISH_AT_WORK_HOW = [
  "Reading documentation",
  "Emails",
  "Chat tools (Slack/Teams)",
  "Writing reports/proposals",
  "Speaking in meetings/video calls",
  "Understanding fast speech (native speakers)",
  "Understanding fast speech (international teams)",
  "Small talk/relationship building",
  "Talking to native speakers",
  "Talking to non-native speakers",
  "Explaining problems and delays",
  "Persuading/negotiating",
  "Giving presentations and speeches",
  "Interviews",
];

export const LEVELS = [
  "Beginner (A1–A2)",
  "Intermediate (B1)",
  "Upper-Intermediate (B2)",
  "Advanced (C1+)",
  "Not sure",
];

export const LESSON_PREFS = [
  "Guided conversation + live corrections",
  "Free conversation (light corrections)",
  "Fluency drills (speaking faster + more smoothly)",
  "Structured coaching (drills + short homework)",
  "Grammar/usage troubleshooting (fix recurring mistakes)",
  "Vocabulary building (natural phrases, collocations, phrasal verbs)",
  "Work English (meetings/calls, explaining, small talk)",
  "Writing (emails/messages, clarity + tone)",
  "Presentations/interviews (structure + delivery)",
  "Test preparation",
  "Not sure — recommend a plan",
];

export const PRACTICE_REALISTIC = [
  "Yes",
  "No",
  "Maybe",
];

export const PRACTICE_TIME = [
  "It's not realistic right now",
  "5–10 min/day (30–60 min/week)",
  "15–30 min/day (2–3.5 hrs/week)",
  "30–60 min/day (3.5–7 hrs/week)",
  "1 hour/day (7 hrs/week)",
  "2+ hours/day (14+ hrs/week)",
];

export const FEEDBACK_PREF = [
  "Every error — interrupt me and correct",
  "Correct me, then let me repeat correctly",
  "Only repeated/serious errors",
  "At the end of the class",
  "Send corrections in writing after class",
  "Never",
];

// ─── Blank student template ───────────────────────────────────

export function blankStudent() {
  return {
    // Student info
    name: "",
    nativeLanguage: "",
    location: "",
    dailyLanguage: "",
    dailyLanguageOther: "",
    otherLanguages: "",
    selfDescription: "",
    level: "",
    // Work
    job: "",
    usesEnglishAtWork: "",
    englishAtWorkHow: [],
    englishAtWorkHowOther: "",
    // Goals & needs
    englishNeeds: [],
    englishNeedsOther: "",
    urgency: "",
    examType: "",
    examTypeOther: "",
    speaksTo: [],
    speaksToOther: "",
    communicationWhere: [],
    difficulties: [],
    interests: "",
    // Lesson preferences
    lessonPrefs: [],
    lessonPrefsOther: "",
    practiceRealistic: "",
    practiceTime: "",
    feedbackPref: "",
    // Teacher observations (all write-in)
    strengths: "",
    troubleSpots: "",
    personality: "",
    otherNotes: "",
  };
}
