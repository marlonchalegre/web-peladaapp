import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatMs,
  getSynchronizedNow,
  getSynchronizedNowIso,
  getServerTimeOffset,
  isServerTimeSynced,
  setServerTimeOffset,
  resetServerTimeOffsetForTesting,
  syncServerTime,
  syncServerTimeFromDateHeader,
  syncServerTimeFromTimestamp,
} from "./timeUtils";

describe("timeUtils", () => {
  beforeEach(() => {
    resetServerTimeOffsetForTesting();
  });

  describe("formatMs", () => {
    it("returns --:-- for null or undefined", () => {
      expect(formatMs(null)).toBe("--:--");
      expect(formatMs(undefined)).toBe("--:--");
    });

    it("formats minutes and seconds with padding", () => {
      expect(formatMs(0)).toBe("00:00");
      expect(formatMs(5000)).toBe("00:05");
      expect(formatMs(65000)).toBe("01:05");
      expect(formatMs(184000)).toBe("03:04");
    });

    it("formats hours when duration exceeds 60 minutes", () => {
      expect(formatMs(3600000)).toBe("1:00:00");
      expect(formatMs(7384000)).toBe("2:03:04");
    });
  });

  describe("server time synchronization", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("defaults to 0 offset and local time when unsynced", () => {
      expect(getServerTimeOffset()).toBe(0);
      expect(isServerTimeSynced()).toBe(false);
      const before = Date.now();
      const syncd = getSynchronizedNow();
      const after = Date.now();
      expect(syncd).toBeGreaterThanOrEqual(before);
      expect(syncd).toBeLessThanOrEqual(after);
    });

    it("sets server time offset manually", () => {
      setServerTimeOffset(5000);
      expect(getServerTimeOffset()).toBe(5000);
      expect(isServerTimeSynced()).toBe(true);

      const localNow = 1000000;
      vi.useFakeTimers();
      vi.setSystemTime(localNow);
      expect(getSynchronizedNow()).toBe(1005000);
      expect(getSynchronizedNowIso()).toBe(new Date(1005000).toISOString());
    });

    it("syncs server time from number timestamp or string via unified syncServerTime", () => {
      vi.useFakeTimers();
      vi.setSystemTime(1000000);

      syncServerTime(1050000, 200);
      expect(isServerTimeSynced()).toBe(true);
      // estimatedServerNow = 1050000 + 100 = 1050100
      // offset = 1050100 - 1000000 = 50100
      expect(getServerTimeOffset()).toBe(50100);
    });

    it("syncs server time from Date header with latency compensation", () => {
      vi.useFakeTimers();
      vi.setSystemTime(1000000); // Client time

      // Server is 3 minutes ahead (1180000)
      const serverDateStr = new Date(1180000).toUTCString();
      const requestDuration = 200; // 200ms latency

      syncServerTimeFromDateHeader(serverDateStr, requestDuration);

      expect(isServerTimeSynced()).toBe(true);
      // estimatedServerNow = 1180000 + 100 = 1180100
      // offset = 1180100 - 1000000 = 180100
      expect(getServerTimeOffset()).toBe(180100);
      expect(getSynchronizedNow()).toBe(1180100);
    });

    it("syncs server time from ISO timestamp", () => {
      vi.useFakeTimers();
      vi.setSystemTime(1000000);

      const serverIso = new Date(1120000).toISOString();
      syncServerTimeFromTimestamp(serverIso, 100);

      expect(isServerTimeSynced()).toBe(true);
      expect(getServerTimeOffset()).toBe(120050);
      expect(getSynchronizedNow()).toBe(1120050);
    });

    it("handles invalid or empty inputs gracefully", () => {
      syncServerTimeFromDateHeader(null);
      expect(isServerTimeSynced()).toBe(false);
      expect(getServerTimeOffset()).toBe(0);

      syncServerTimeFromDateHeader("invalid-date");
      expect(isServerTimeSynced()).toBe(false);
      expect(getServerTimeOffset()).toBe(0);

      syncServerTimeFromTimestamp(null);
      expect(isServerTimeSynced()).toBe(false);
      expect(getServerTimeOffset()).toBe(0);
    });
  });
});
