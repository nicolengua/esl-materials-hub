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

  const system = `You are an expert ESL materials designer working with a private tutor. Your job is to create customized, pedagogically sound practice materials for individual students.

Guidelines:
- All materials should be appropriate for the student's CEFR level
- Be aware of L1 interference patterns from their native language
- Match the student's interests and real-world needs where possible
- Grade vocabulary and sentence complexity appropriately
- Include clear instructions the student can follow independently
- For vocabulary, include: word, part of speech, definition, example sentence, and (when relevant) L1 cognate or false cognate warning
- For grammar exercises, target the specific trouble spots identified
- For reading passages, write original graded text (not copied from external sources)
- For writing prompts, make them personally relevant to the student
- Output should be clean, well-structured HTML that can be converted to PDF`;

  const user = `STUDENT PROFILE:
${profile.join("\n")}

TEACHER OBSERVATIONS:
${obs.length ? obs.join("\n") : "None yet — first session or new student."}

CLASS NOTES FROM TODAY:
${classNotes}

REQUESTED MATERIALS:
${materialTypes.join(", ")}

Please generate the requested materials as well-structured HTML. Use clear headings, numbered exercises, and professional formatting. Each material type should be a distinct section.`;

  return { system, user };
}

export const MATERIAL_TYPES = [
  "Vocabulary worksheet",
  "Grammar exercises",
  "Graded reading passage + comprehension questions",
  "Writing prompt",
  "Conversation discussion questions",
  "Pronunciation guide",
  "Post-class review summary",
  "Homework assignment",
];
