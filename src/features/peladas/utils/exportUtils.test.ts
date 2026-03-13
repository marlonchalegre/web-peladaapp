import { describe, it, expect } from "vitest";
import {
  generateExportText,
  generateAnnouncementText,
  type PlayerWithUser,
} from "./exportUtils";
import { type Team, type User } from "../../../shared/api/endpoints";

describe("exportUtils", () => {
  const mockTeams: Team[] = [
    { id: 1, pelada_id: 1, name: "Time 1" },
    { id: 2, pelada_id: 1, name: "Time 2" },
  ];

  const mockUser1: User = {
    id: 101,
    name: "Marlon",
    username: "marlon",
    position: "striker",
  };
  const mockUser2: User = {
    id: 102,
    name: "Chalegre",
    username: "chalegre",
    position: "defender",
  };

  const mockPlayers: Record<number, PlayerWithUser[]> = {
    1: [
      {
        id: 1,
        user_id: 101,
        user: mockUser1,
        grade: 8.5,
        organization_id: 1,
        is_goalkeeper: false,
      },
    ],
    2: [
      {
        id: 2,
        user_id: 102,
        user: mockUser2,
        grade: 7.0,
        is_goalkeeper: true,
        organization_id: 1,
      },
    ],
  };

  describe("generateExportText", () => {
    it("should format lineup with grades correctly", () => {
      const scores = { 1: 9.0 }; // Specific match score
      const result = generateExportText(mockTeams, mockPlayers, scores);

      expect(result).toContain("TIME 1");
      expect(result).toContain("Marlon");
      expect(result).toContain("A"); // striker -> A
      expect(result).toContain("9,00"); // from scores

      expect(result).toContain("TIME 2");
      expect(result).toContain("Chalegre");
      expect(result).toContain("G"); // is_goalkeeper -> G
      expect(result).toContain("7,00"); // from p.grade fallback
    });
    it("should handle score of 0 correctly", () => {
      const scores = { 1: 0 };
      const result = generateExportText(mockTeams, mockPlayers, scores);
      expect(result).toContain("0,00");
    });
  });

  describe("generateAnnouncementText", () => {
    it("should format announcement without grades", () => {
      const result = generateAnnouncementText(mockTeams, mockPlayers);

      expect(result).toContain("TIME 1");
      expect(result).toContain("Marlon");
      expect(result).toContain("A");
      expect(result).not.toContain("8.5");
      expect(result).not.toContain("7.0");
    });
  });
});
