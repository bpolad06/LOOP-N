/* global __UC_ADMIN_EMAILS__ */
/**
 * Admin e-poçtları: .env → VITE_ADMIN_EMAILS (vite.config define → __UC_ADMIN_EMAILS__).
 * Nümunə: VITE_ADMIN_EMAILS=sizin@unec.edu.az,diger@edu.az
 */
export function getAdminEmails() {
  const raw =
    typeof __UC_ADMIN_EMAILS__ !== "undefined"
      ? String(__UC_ADMIN_EMAILS__ || "")
      : "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email || typeof email !== "string") return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
