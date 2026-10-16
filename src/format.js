export function fullName(person) {
  return [person?.firstName, person?.lastName].filter(Boolean).join(" ");
}

export function initials(person) {
  const letters = `${person?.firstName?.[0] ?? ""}${person?.lastName?.[0] ?? ""}`;
  return letters.toUpperCase() || "?";
}

export function roleLabel(role) {
  if (role === "SUPER_ADMIN") return "Super admin";
  if (role === "PROJECT_USER") return "Project user";
  return role ?? "";
}

export function formatNumber(value, language) {
  return new Intl.NumberFormat(language === "am" ? "am-ET" : "en").format(
    value ?? 0,
  );
}

export function formatDateTime(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return new Intl.DateTimeFormat(language === "am" ? "am-ET" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatYearMonth(yearMonth, language) {
  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) return yearMonth ?? "";
  const [year, month] = yearMonth.split("-").map(Number);
  return new Intl.DateTimeFormat(language === "am" ? "am-ET" : "en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 15)));
}

export function passwordTooLong(password) {
  return password.length > 72;
}
