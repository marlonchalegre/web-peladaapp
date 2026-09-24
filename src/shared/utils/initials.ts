/**
 * Extracts up to two uppercase initials from a full name.
 * Returns `fallback` if the name is missing or empty.
 */
export function getInitials(name?: string | null, fallback = ""): string {
  if (!name) return fallback;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return initials || fallback;
}
