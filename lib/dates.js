// One source of truth for "today" on a sheet. Nick teaches from Zapopan, so the
// sheet date and filename follow America/Mexico_City (UTC-6, no DST) — not the
// server clock, which runs on UTC and rolls to tomorrow during evening classes.

export const SHEET_TIMEZONE = "America/Mexico_City";

// Today's date as it appears on a sheet, e.g. "6 July 2026".
export function todaySheetDate() {
  return new Date().toLocaleDateString("en-GB", {
    timeZone: SHEET_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
