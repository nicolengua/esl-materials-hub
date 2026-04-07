// Student profile field options — iterated with Nick across multiple sessions

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const ENGLISH_NEEDS = [
  "Work: emails/chat",
  "Work: presentations",
  "Work: meetings",
  "Work: technical docs",
  "Exam prep (IELTS/TOEFL/Cambridge)",
  "Academic writing",
  "Travel",
  "Daily life / social",
  "Immigration / citizenship",
  "Job interviews",
  "General fluency",
];

export const DIFFICULTIES = [
  "Speaking fluently",
  "Understanding native speakers",
  "Grammar accuracy",
  "Vocabulary range",
  "Writing clearly",
  "Pronunciation",
  "Reading speed",
  "Listening to media",
  "Small talk / social English",
  "Professional/formal register",
];

export const LESSON_PREFS = [
  "Free conversation",
  "Structured lessons",
  "Grammar focused",
  "Vocabulary building",
  "Pronunciation drills",
  "Reading & discussion",
  "Listening practice",
  "Writing feedback",
  "Role plays / simulation",
  "Exam practice",
  "Mix of everything",
];

export const PRACTICE_TIME = [
  "Almost none",
  "15-30 min/week",
  "30-60 min/week",
  "1+ hours/week",
];

export const FEEDBACK_PREF = [
  "Correct me immediately",
  "Note errors, review at end",
  "Only correct big mistakes",
  "Written notes after class",
];

export const STRENGTHS = [
  "Good vocabulary range for familiar topics",
  "Willing to self-correct",
  "Strong reading comprehension",
  "Good listening comprehension",
  "Not afraid to make mistakes",
  "Can sustain a conversation",
  "Good pronunciation overall",
  "Strong writing skills",
  "Uses complex sentences",
  "Good at paraphrasing when stuck",
];

export const TROUBLE_SPOTS = [
  "Articles (a/the/zero article)",
  "Prepositions",
  "Subject-verb agreement",
  "Present perfect vs. past simple",
  "Conditional structures",
  "Word order in questions",
  "Verb tense consistency",
  "Passive voice",
  "Relative clauses",
  "Collocations / word partnerships",
  "False cognates from L1",
  "Avoids complex sentences",
  "Pronunciation (specific sounds)",
  "Fillers / long pauses when speaking",
  "Run-on sentences / no connectors",
  "Register (too formal / too informal)",
];

export const L1_INTERFERENCE = [
  'Omits subjects ("Is raining")',
  "Omits/misuses articles",
  "Preposition transfer from L1",
  "False cognates",
  "Adjective placement (after noun)",
  "Gender transfer to English",
  "Overuse of progressive (-ing)",
  '"That" clause transfer (wants that I do)',
  "Double negatives",
  "Literal translation of phrasal verbs",
  "Pronunciation: vowel confusion",
  "Pronunciation: final consonant dropping",
  "Pronunciation: th sounds",
];

export const PERSONALITY = [
  "Talkative / high energy",
  "Quiet / needs prompting",
  "Confident speaker",
  "Anxious / self-conscious",
  "Perfectionist (avoids risk)",
  "Humor-driven / responds to jokes",
  "Detail-oriented",
  "Big-picture thinker",
  "Prefers structure and routine",
  "Prefers variety and spontaneity",
  "Responds well to direct correction",
  "Sensitive to correction",
  "Highly motivated",
  "Inconsistent effort / busy schedule",
];


export function blankStudent() {
  return {
    name: "",
    nativeLanguage: "",
    otherLanguages: "",
    selfDescription: "",
    dailyLanguage: "",
    location: "",
    level: "",
    job: "",
    englishAtWork: "",
    englishNeeds: [],
    examType: "",
    urgency: "",
    difficulties: [],
    lessonPrefs: [],
    practiceTime: "",
    feedbackPref: "",
    recordingConsent: "",
    interests: "",
    strengths: [],
    strengthsOther: "",
    troubleSpots: [],
    troubleSpotsOther: "",
    l1Interference: [],
    l1InterferenceOther: "",
    personality: [],
    personalityOther: "",
    otherNotes: "",
    classNotes: [],
  };
}
