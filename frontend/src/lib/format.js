// Small formatting helpers shared across screens (FR locale).

export function fullName(user, fallback = "Utilisateur") {
  if (!user) return fallback;
  const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return name || user.email || fallback;
}

export function initials(user) {
  if (!user) return "?";
  const first = user.first_name?.[0] || "";
  const last = user.last_name?.[0] || "";
  const combined = `${first}${last}`.trim();
  return (combined || user.email?.[0] || "?").toUpperCase();
}

export function formatPrice(amount, currency = "EUR") {
  const value = Number(amount);
  if (Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);
}

export function formatDate(value, options) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", options || { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value) {
  return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}

// Human-friendly relative time ("il y a 3 min"), falling back to a date.
export function formatRelative(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return rtf.format(diffH, "hour");
  const diffD = Math.round(diffH / 24);
  if (Math.abs(diffD) < 7) return rtf.format(diffD, "day");
  return formatDate(value);
}

// Normalize a DRF/axios error into a displayable French message.
export function errorMessage(error, fallback = "Une erreur est survenue.") {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const firstField = Object.values(data)[0];
  if (Array.isArray(firstField)) return firstField[0];
  if (typeof firstField === "string") return firstField;
  return fallback;
}
