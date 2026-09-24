import { describe, it, expect } from "vitest";
import { formatLocationDisplay, getGoogleMapsUrl } from "./locationUtils";

describe("locationUtils", () => {
  describe("formatLocationDisplay", () => {
    it("handles null, undefined and empty strings", () => {
      expect(formatLocationDisplay(null)).toBe("");
      expect(formatLocationDisplay(undefined)).toBe("");
      expect(formatLocationDisplay("")).toBe("");
      expect(formatLocationDisplay("   ")).toBe("");
    });

    it("formats full OSM address to place and city", () => {
      expect(
        formatLocationDisplay(
          "Ilha do Retiro, Recife, Pernambuco, Região Nordeste, Brasil",
        ),
      ).toBe("Ilha do Retiro, Recife");
    });

    it("formats address with postal code and metro region", () => {
      expect(
        formatLocationDisplay(
          "Arena Corinthians, Itaquera, São Paulo, Região Metropolitana de São Paulo, São Paulo, Região Sudeste, 08295-005, Brasil",
        ),
      ).toBe("Arena Corinthians, São Paulo");
    });

    it("handles short two-part addresses", () => {
      expect(formatLocationDisplay("Arena Central, Campinas")).toBe(
        "Arena Central, Campinas",
      );
    });

    it("handles single custom location string without commas", () => {
      expect(formatLocationDisplay("Arena Vila Nova · Q2")).toBe(
        "Arena Vila Nova · Q2",
      );
    });

    it("handles address with state abbreviation", () => {
      expect(formatLocationDisplay("Arena das Dunas, Natal, RN, Brasil")).toBe(
        "Arena das Dunas, Natal",
      );
    });
  });

  describe("getGoogleMapsUrl", () => {
    it("generates correct Google Maps search URL", () => {
      expect(getGoogleMapsUrl("Ilha do Retiro, Recife")).toBe(
        "https://www.google.com/maps/search/?api=1&query=Ilha%20do%20Retiro%2C%20Recife",
      );
    });
  });
});
