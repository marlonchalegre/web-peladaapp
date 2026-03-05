import { describe, it, expect } from "vitest";
import {
  generateExportText,
  generateAnnouncementText,
  generateExportCsv,
} from "./exportUtils";
import type { Player, Team, User } from "../../../shared/api/endpoints";

describe("exportUtils", () => {
  const mockUser1: User = {
    id: 1,
    name: "Gandalf",
    username: "gandalf",
    position: "Midfielder",
  };
  const mockUser2: User = {
    id: 2,
    name: "Aragorn",
    username: "aragorn",
    position: "Striker",
  };
  const mockUser3: User = {
    id: 3,
    name: "Gimli",
    username: "gimli",
    position: "Defender",
  };
  const mockUser4: User = {
    id: 4,
    name: "Sauron",
    username: "sauron",
    position: "Goalkeeper",
  };

  const mockTeams: Team[] = [
    { id: 1, pelada_id: 1, name: "Time 1" },
    { id: 2, pelada_id: 1, name: "Time 2" },
  ];

  const mockTeamPlayers: Record<
    number,
    (Player & { user: User; is_goalkeeper?: boolean })[]
  > = {
    1: [
      { id: 101, user_id: 1, organization_id: 1, user: mockUser1, grade: 8.5 },
      { id: 103, user_id: 3, organization_id: 1, user: mockUser3, grade: 7.0 },
    ],
    2: [
      { id: 102, user_id: 2, organization_id: 1, user: mockUser2, grade: 9.0 },
      {
        id: 104,
        user_id: 4,
        organization_id: 1,
        user: mockUser4,
        grade: 6.5,
        is_goalkeeper: true,
      },
    ],
  };

  const mockScores: Record<number, number> = {
    101: 8.5,
    102: 9.0,
    103: 7.0,
    104: 6.5,
  };

  describe("generateExportText", () => {
    it("should format text with aligned columns and proper averages", () => {
      const result = generateExportText(mockTeams, mockTeamPlayers, mockScores);

      // Check for backticks
      expect(result.startsWith("```")).toBe(true);
      expect(result.endsWith("```")).toBe(true);

      // Check for team names (uppercase)

      expect(result).toContain("TIME 1");
      expect(result).toContain("TIME 2");

      // Check for averages (comma decimal)
      expect(result).toContain("MÉDIA  7,75"); // (8.5 + 7.0) / 2
      expect(result).toContain("MÉDIA  7,75"); // (9.0 + 6.5) / 2

      // Check for player names and positions (Z, M, A, G)
      expect(result).toContain("Gandalf");
      expect(result).toContain("M "); // Midfielder
      expect(result).toContain("Gimli");
      expect(result).toContain("Z "); // Defender
      expect(result).toContain("Sauron");
      expect(result).toContain("G "); // Goalkeeper
    });

    it("should handle players without positions", () => {
      const teamPlayersNoPos: Record<
        number,
        (Player & { user: User; is_goalkeeper?: boolean })[]
      > = {
        1: [
          {
            id: 105,
            user_id: 5,
            organization_id: 1,
            user: { id: 5, name: "Unknown", username: "u" },
            grade: 5.0,
          },
        ],
      };
      const result = generateExportText(
        [{ id: 1, pelada_id: 1, name: "T1" }],
        teamPlayersNoPos,
        { 105: 5.0 },
      );
      expect(result).toContain("?");
    });
  });

  describe("generateAnnouncementText", () => {
    it("should format text for WhatsApp without scores", () => {
      const result = generateAnnouncementText(mockTeams, mockTeamPlayers);

      expect(result.startsWith("```")).toBe(true);
      expect(result.endsWith("```")).toBe(true);
      expect(result).toContain("*ESCALAÇÃO DA PELADA*");
      expect(result).toContain("*TIME 1*");
      // "Gandalf" is 7 chars, nameWidth will be at least 15+2 = 17
      expect(result).toMatch(/• Gandalf\s+M/);
      expect(result).toMatch(/• Gimli\s+Z/);
      expect(result).not.toContain("8,5");
      expect(result).not.toContain("7,0");
    });
  });

  describe("generateExportCsv", () => {
    it("should generate valid CSV content with BOM", () => {
      const result = generateExportCsv(mockTeams, mockTeamPlayers, mockScores);

      expect(result.startsWith("\uFEFF")).toBe(true);
      expect(result).toContain("Time;Nome;Posição;Nota");
      expect(result).toContain("Time 1;Gandalf;M;8,50");
      expect(result).toContain("Time 2;Sauron;G;6,50");
    });
  });
});
