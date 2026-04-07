// Builds the Claude API prompt from student profile + class notes

export function buildPrompt(student, classNotes, materialTypes) {
  const profile = [];

  profile.push(`Student: ${student.name}`);
  profile.push(`Native language: ${student.nativeLanguage}`);
  if (student.otherLanguages) profile.push(`Other languages: ${student.otherLanguages}`);
  if (student.level) profile.push(`CEFR level: ${student.level}`);
  if (student.job) profile.push(`Job: ${student.job}`);
  if (student.location) profile.push(`Location: ${student.location}`);
  if (student.dailyLanguage) profile.push(`Daily language environment: ${student.dailyLanguage}`);
  if (student.selfDescription) profile.push(`Student self-description: ${student.selfDescription}`);
  if (student.englishNeeds.length) profile.push(`English needs: ${student.englishNeeds.join(", ")}`);
  if (student.englishAtWork) profile.push(`English at work: ${student.englishAtWork}`);
  if (student.examType) profile.push(`Exam: ${student.examType}`);
  if (student.difficulties.length) profile.push(`Self-reported difficulties: ${student.difficulties.join(", ")}`);
  if (student.interests) profile.push(`Interests: ${student.interests}`);

  const obs = [];
  if (student.strengths.length) obs.push(`Strengths: ${student.strengths.join(", ")}${student.strengthsOther ? "; " + student.strengthsOther : ""}`);
  if (student.troubleSpots.length) obs.push(`Trouble spots: ${student.troubleSpots.join(", ")}${student.troubleSpotsOther ? "; " + student.troubleSpotsOther : ""}`);
  if (student.l1Interference.length) obs.push(`L1 interference: ${student.l1Interference.join(", ")}${student.l1InterferenceOther ? "; " + student.l1InterferenceOther : ""}`);
  if (student.personality.length) obs.push(`Personality/rapport: ${student.personality.join(", ")}${student.personalityOther ? "; " + student.personalityOther : ""}`);
  if (student.lessonPrefs.length) obs.push(`Lesson preferences: ${student.lessonPrefs.join(", ")}`);
  if (student.practiceTime) obs.push(`Practice time: ${student.practiceTime}`);
  if (student.feedbackPref) obs.push(`Feedback preference: ${student.feedbackPref}`);
  if (student.otherNotes) obs.push(`Other: ${student.otherNotes}`);

  // Generate today's date in DD MONTH, YYYY format
  const today = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dateStr = `${String(today.getDate()).padStart(2, "0")} ${months[today.getMonth()]}, ${today.getFullYear()}`;

  const system = `You are an expert ESL materials designer working with a private tutor named Nick. Your job is to create customized, pedagogically sound practice materials for individual students.

HEADER AND FORMAT RULES:
- The document header must ALWAYS be: "Nick's Class - Review"
- Immediately below the header, display the date: "${dateStr}"
- Below the date, display: Student name, CEFR level, Native language

VOCABULARY WORKSHEET RULES:
- For each vocabulary item, ALWAYS include: word, part of speech, definition, example sentence, AND a translation into the student's native language (L1)
- When the teacher's notes include a word with a parenthetical note (e.g. "equivalence (diploma)"), the parenthetical indicates the SPECIFIC CONTEXT or usage intended. The definition and example sentence must reflect that specific meaning, not the general dictionary definition. For example, "equivalence (diploma)" means the recognition that a foreign diploma is equal to a local one — not the abstract concept of equivalence.
- When relevant, include L1 cognate or false cognate warnings

GRADED READING PASSAGE RULES:
- Write original graded text appropriate to the student's CEFR level
- All target vocabulary from the lesson must appear in BOLD in the reading passage (use <strong> tags)
- The passage should naturally incorporate the vocabulary in context

PRONUNCIATION EXERCISE RULES:
- When the teacher's notes indicate pronunciation issues (e.g. words marked with "(pron.)" or specific sounds mentioned), generate pronunciation practice
- The CORE of the pronunciation exercise should be sentences that contain MULTIPLE CONTRASTING PHONEMES in a single sentence. For example, if the student struggles with "head/hand/heart", generate: "He put his hard hand on his head and then his heart."
- Be aware of specific L1-based pronunciation difficulties:
  * Russian/Ukrainian speakers: /θ/ and /ð/ (th sounds), /w/ vs /v/, vowel reduction
  * Spanish speakers: /b/ vs /v/, /ʃ/ (sh), vowel length, word-final consonant clusters
  * Mandarin speakers: /r/ vs /l/, final consonants, /θ/ and /ð/, tonal interference
  * Italian speakers: /h/ (often dropped), double consonant habits, /θ/ and /ð/
  * French speakers: /h/ (often silent), /θ/ and /ð/, word stress patterns
  * Turkish speakers: /θ/ and /ð/, /w/ vs /v/, initial consonant clusters
  * Arabic speakers: /p/ vs /b/, /v/ vs /f/, vowel distinctions
  * Brazilian Portuguese speakers: final consonant addition (adding vowels), /θ/ and /ð/, /r/ sounds
- Generate minimal pair words and then sentences that contrast the problem sounds
- Include phonetic guidance where helpful

GENERAL GUIDELINES:
- All materials should be appropriate for the student's CEFR level
- Be aware of L1 interference patterns from their native language
- Match the student's interests and real-world needs where possible
- Grade vocabulary and sentence complexity appropriately
- Include clear instructions the student can follow independently
- For grammar exercises, target the specific trouble spots identified
- For writing prompts, make them personally relevant to the student
- Output should be clean, well-structured HTML that can be converted to PDF
- Use professional formatting with clear headings and numbered exercises`;

  const user = `STUDENT PROFILE:
${profile.join("\n")}

TEACHER OBSERVATIONS:
${obs.length ? obs.join("\n") : "None yet — first session or new student."}

CLASS NOTES FROM TODAY:
${classNotes}

REQUESTED MATERIALS:
${materialTypes.join(", ")}

Please generate the requested materials as well-structured HTML. The document must begin with the header "Nick's Class - Review" and today's date (${dateStr}). Use clear headings, numbered exercises, and professional formatting. Each material type should be a distinct section.`;

  return { system, user };
}

export const MATERIAL_TYPES = [
  "Vocabulary worksheet",
  "Grammar exercises",
  "Graded reading passage + comprehension questions",
  "Writing prompt",
  "Conversation discussion questions",
  "Pronunciation exercise",
  "Post-class review summary",
  "Homework assignment",
];
