// A writer can hide profile sections via `profile_sections` (e.g. {scholar:false}).
// A missing key means "show it when it has content".
export function sectionVisible(writer, key) {
  return writer?.profile_sections?.[key] !== false;
}

// "2019 — aujourd'hui" / "2014 — 2019" / "2019" depending on what's filled.
export function yearRange({ start_year, end_year }) {
  if (!start_year && !end_year) return "";
  if (start_year && !end_year) return `${start_year} — aujourd'hui`;
  if (!start_year && end_year) return `${end_year}`;
  return `${start_year} — ${end_year}`;
}
