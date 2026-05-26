/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { sortPlayersByPosition } from "./playerUtils";

describe("playerUtils", () => {
  describe("sortPlayersByPosition", () => {
    const players = [
      { id: "1", user: { name: "Striker A", position: "Striker" } },
      { id: "2", user: { name: "Defender A", position: "Defender" } },
      { id: "3", user: { name: "Goalkeeper A", position: "Goalkeeper" } },
      { id: "4", user: { name: "Midfielder A", position: "Midfielder" } },
    ] as any;

    it("should sort by standard position order (GK > DF > MF > ST)", () => {
      const sorted = sortPlayersByPosition(players);
      expect(sorted[0].user.name).toBe("Goalkeeper A");
      expect(sorted[1].user.name).toBe("Defender A");
      expect(sorted[2].user.name).toBe("Midfielder A");
      expect(sorted[3].user.name).toBe("Striker A");
    });

    it("should respect manual goalkeeper override (is_goalkeeper)", () => {
      const mixedPlayers = [
        {
          id: "1",
          is_goalkeeper: false,
          user: { name: "GK by position", position: "Goalkeeper" },
        },
        {
          id: "2",
          is_goalkeeper: true,
          user: { name: "ST but is GK", position: "Striker" },
        },
      ] as any;
      const sorted = sortPlayersByPosition(mixedPlayers);
      expect(sorted[0].user.name).toBe("ST but is GK");
    });

    it("should sort alphabetically by name as a tie-breaker", () => {
      const samePos = [
        { id: "1", user: { name: "Charlie", position: "Midfielder" } },
        { id: "2", user: { name: "Alpha", position: "Midfielder" } },
        { id: "3", user: { name: "Bravo", position: "Midfielder" } },
      ] as any;
      const sorted = sortPlayersByPosition(samePos);
      expect(sorted[0].user.name).toBe("Alpha");
      expect(sorted[1].user.name).toBe("Bravo");
      expect(sorted[2].user.name).toBe("Charlie");
    });

    it("should put unknown positions at the end", () => {
      const unknown = [
        { id: "1", user: { name: "Unknown", position: "Waterboy" } },
        { id: "2", user: { name: "Striker", position: "Striker" } },
      ] as any;
      const sorted = sortPlayersByPosition(unknown);
      expect(sorted[0].user.name).toBe("Striker");
      expect(sorted[1].user.name).toBe("Unknown");
    });
  });
});
