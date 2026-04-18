export function isVerifiedStudentEmail(email) {
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase().endsWith(".edu.az");
}

export function chatIdForPair(uidA, uidB) {
  return [uidA, uidB].sort().join("__");
}
