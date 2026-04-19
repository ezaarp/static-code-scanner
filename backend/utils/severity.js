export function severityToCvss(sev) {
  sev = (sev || "").toUpperCase();
  if (sev === "ERROR" || sev === "HIGH") return 8.0;
  if (sev === "MEDIUM") return 5.0;
  if (sev === "LOW") return 2.0;
  if (sev === "INFO") return 0.1;
  return 5.0; // fallback Medium
}

export function cvssCategory(score) {
  if (score === 0.0) return "None";
  if (score >= 0.1 && score <= 3.9) return "Low";
  if (score >= 4.0 && score <= 6.9) return "Medium";
  if (score >= 7.0 && score <= 8.9) return "High";
  if (score >= 9.0 && score <= 10.0) return "Critical";
  return "Unknown";
}
