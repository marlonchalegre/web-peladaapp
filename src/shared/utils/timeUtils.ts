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

let serverTimeOffsetMs = 0;
let hasSyncedServerTime = false;

export function setServerTimeOffset(offsetMs: number): void {
  serverTimeOffsetMs = offsetMs;
  hasSyncedServerTime = true;
}

export function getServerTimeOffset(): number {
  return serverTimeOffsetMs;
}

export function isServerTimeSynced(): boolean {
  return hasSyncedServerTime;
}

export function resetServerTimeOffsetForTesting(): void {
  serverTimeOffsetMs = 0;
  hasSyncedServerTime = false;
}

export function getSynchronizedNow(): number {
  return Date.now() + serverTimeOffsetMs;
}

export function getSynchronizedNowIso(): string {
  return new Date(getSynchronizedNow()).toISOString();
}

/**
 * Synchronize server clock offset from an ISO timestamp, HTTP Date header, or epoch ms.
 * Round-trip latency is halved to compensate for network transit time.
 */
export function syncServerTime(
  serverTimeInput: string | number | null | undefined,
  requestDurationMs = 0,
): void {
  if (!serverTimeInput) return;
  const serverTime =
    typeof serverTimeInput === "number"
      ? serverTimeInput
      : new Date(serverTimeInput).getTime();
  if (isNaN(serverTime)) return;

  const estimatedServerNow = serverTime + Math.round(requestDurationMs / 2);
  const offset = estimatedServerNow - Date.now();
  setServerTimeOffset(offset);
}

export const syncServerTimeFromDateHeader = syncServerTime;
export const syncServerTimeFromTimestamp = syncServerTime;
