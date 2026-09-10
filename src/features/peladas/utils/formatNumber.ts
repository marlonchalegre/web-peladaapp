/**
 * Renders a number with the decimal comma the app uses everywhere — team
 * averages, exported summaries and the draw report all read the same way.
 * Non-numbers become a dash so callers can pass optional fields straight in.
 */
export function formatDecimal(value: unknown, digits = 2): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits).replace(".", ",")
    : "-";
}
