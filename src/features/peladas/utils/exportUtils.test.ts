/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import {
  generateAvailablePlayersText,
  generateExportText,
  generateAnnouncementText,
  generateExportCsv,
  copyToClipboard,
} from "./exportUtils";

describe("exportUtils", () => {
  const mockPlayers = [
    { id: "1", user: { name: "Player 1", position: "Striker" }, grade: 8.5 },
    { id: "2", user: { name: "Player 2", position: "Goalkeeper" }, grade: 9.0 },
  ] as any;
  const mockTeams = [{ id: "t1", name: "Team 1" }] as any;
  const mockTeamPlayers = { t1: mockPlayers };
  const mockScores = { "1": 8.7 };

  it("generateAvailablePlayersText returns formatted text", () => {
    const text = generateAvailablePlayersText(mockPlayers, mockScores);
    expect(text).toContain("Striker");
    expect(text).toContain("Player 1");
    expect(text).toContain("8,7");
  });

  it("generateExportText returns formatted text", () => {
    const text = generateExportText(mockTeams, mockTeamPlayers, mockScores);
    expect(text).toContain("TEAM 1");
    expect(text).toContain("Player 1");
    expect(text).toContain("8,70");
    expect(text).toContain("MÉDIA");
  });

  it("generateAnnouncementText returns formatted text", () => {
    const text = generateAnnouncementText(mockTeams, mockTeamPlayers);
    expect(text).toContain("ESCALAÇÃO DA PELADA");
    expect(text).toContain("TEAM 1");
  });

  it("generateExportCsv returns csv string", () => {
    const csv = generateExportCsv(mockTeams, mockTeamPlayers, mockScores);
    expect(csv).toContain("Time;Nome;Posição;Nota");
    expect(csv).toContain("Team 1;Player 1;A;8,70");
  });

  it("copyToClipboard works", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(true) },
    });
    const success = await copyToClipboard("test");
    expect(success).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test");
  });
});
