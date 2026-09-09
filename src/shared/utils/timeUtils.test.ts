import { describe, it, expect } from "vitest";
import { formatMs } from "./timeUtils";

describe("timeUtils", () => {
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
});
