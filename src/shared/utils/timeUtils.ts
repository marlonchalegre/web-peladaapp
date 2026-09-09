/**
 * Formats a duration in milliseconds to HH:MM:SS or MM:SS format.
 * Returns '--:--' if ms is null or undefined.
 */
export function formatMs(ms?: number | null): string {
  if (ms === undefined || ms === null) return "--:--";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}
