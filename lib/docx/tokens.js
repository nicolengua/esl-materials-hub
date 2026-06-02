// The fixed design system — §8 of the methodology file.
// Keeping these values in one place is what makes every sheet look like one
// consistent product. Colors are hex WITHOUT the leading "#". Font sizes in
// docx are "half-points" (so 22 = 11pt).

export const COLORS = {
  accent: "0F7A63",       // teal — title, section headers, target words, the rule line
  accentLight: "E4F3EE",  // light teal — answer boxes, pull quotes, reference cards
  amberBg: "FBEFD7",      // amber callout background
  amberBorder: "E0A53B",  // amber callout border
  gridRed: "B23A48",      // correction grid: "you said" header
  gridGreen: "147A52",    // correction grid: "say instead" header (and green text)
  gridGray: "6A6A6A",     // correction grid: "why" header
  body: "262626",         // body text
  gray: "6A6A6A",         // secondary text / labels
  white: "FFFFFF",
};

export const FONT = "Arial";

// Font sizes in half-points (docx convention): pt * 2.
export const SIZE = {
  title: 32,        // 16pt — sheet title
  sectionHead: 28,  // 14pt — section headers
  body: 22,         // 11pt — body
  small: 20,        // 10pt — secondary/labels
  rule: 21,         // ~10.5pt — the italic rule line under a header
};

// Page setup: US Letter, 1-inch margins. Values in twips (1 inch = 1440).
export const PAGE = {
  size: { width: 12240, height: 15840 },
  margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
};
