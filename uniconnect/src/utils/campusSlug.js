/** Universitet adını Firestore path üçün təhlükəsiz sətirə çevirir. */
export function universityToCampusSlug(university) {
  if (!university || typeof university !== "string") return "digər";
  const s = university
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return s || "digər";
}
