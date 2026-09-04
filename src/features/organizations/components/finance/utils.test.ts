import { describe, it, expect } from "vitest";
import { calculateMonthlyFine, formatCurrency, formatDateOnly } from "./utils";

describe("finance/utils", () => {
  describe("calculateMonthlyFine", () => {
    it("should return 0 when payment is on or before deadline", () => {
      const fine = calculateMonthlyFine(2026, 9, "2026-09-05", 10, 5);
      expect(fine).toBe(0);
    });

    it("should return fineAmount when payment is after deadline", () => {
      const fine = calculateMonthlyFine(2026, 9, "2026-09-06", 10, 5);
      expect(fine).toBe(10);
    });
  });

  describe("formatCurrency", () => {
    it("should format positive amounts correctly in BRL", () => {
      const result = formatCurrency(80, "pt-BR", "BRL");
      // Clean non-breaking spaces
      expect(result.replace(/\u00a0/g, " ")).toContain("R$ 80,00");
    });

    it("should format zero correctly in BRL", () => {
      const result = formatCurrency(0, "pt-BR", "BRL");
      expect(result.replace(/\u00a0/g, " ")).toContain("R$ 0,00");
    });
  });

  describe("formatDateOnly", () => {
    it("should format YYYY-MM-DD string into localized date", () => {
      const result = formatDateOnly("2026-09-04", "pt-BR");
      expect(result).toBe("04/09/2026");
    });

    it("should return '-' for null or undefined dates", () => {
      expect(formatDateOnly(null)).toBe("-");
      expect(formatDateOnly(undefined)).toBe("-");
    });
  });
});
