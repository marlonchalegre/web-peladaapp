import { describe, it, expect, vi } from "vitest";
import { formatPeladaSummary } from "./formatSummary";
import { type StandingRow } from "../components/StandingsPanel";
import { type PlayerStatRow } from "../components/PlayerStatsPanel";

describe("formatPeladaSummary", () => {
  it("should format the summary correctly with full data", () => {
    const date = "2026-02-18T15:00:00Z";
    const standings: StandingRow[] = [
      { teamId: 3, name: "Time 3", wins: 5, draws: 1, losses: 0 },
      { teamId: 2, name: "Time 2", wins: 1, draws: 3, losses: 2 },
      { teamId: 1, name: "Time 1", wins: 0, draws: 2, losses: 4 },
    ];
    const playerStats: PlayerStatRow[] = [
      { playerId: 1, name: "Chalegre", goals: 4, assists: 0, ownGoals: 0 },
      { playerId: 2, name: "C.Bala", goals: 3, assists: 0, ownGoals: 0 },
      { playerId: 3, name: "Rafa Lucena", goals: 0, assists: 2, ownGoals: 0 },
      { playerId: 4, name: "Igor", goals: 0, assists: 2, ownGoals: 0 },
    ];

    const result = formatPeladaSummary(date, standings, playerStats);

    expect(result).toContain("Resumo da rodada 18/02");
    expect(result).toContain("Time 3 - 16 Pontos(5V 1E 0D)");
    expect(result).toContain("Time 2 - 6 Pontos(1V 3E 2D)");
    expect(result).toContain("Time 1 - 2 Pontos(0V 2E 4D)");
    expect(result).toContain("Gols:");
    expect(result).toContain("Chalegre - 4");
    expect(result).toContain("C.Bala - 3");
    expect(result).toContain("Assistencias:");
    expect(result).toContain("Rafa Lucena - 2");
    expect(result).toContain("Igor - 2");
    // Should NOT contain the footnote artifacts
    expect(result).not.toContain("[1]");
  });

  it("should handle empty stats correctly", () => {
    const date = null;
    const standings: StandingRow[] = [];
    const playerStats: PlayerStatRow[] = [];

    const result = formatPeladaSummary(date, standings, playerStats);

    expect(result).toContain("Resumo da rodada");
    expect(result).toContain("Classificacao:");
    expect(result).not.toContain("Gols:");
    expect(result).not.toContain("Assistencias:");
  });

  it("should hide sections with zero values", () => {
    const date = "2026-02-18T15:00:00Z";
    const standings: StandingRow[] = [
      { teamId: 1, name: "Time 1", wins: 1, draws: 0, losses: 0 },
    ];
    const playerStats: PlayerStatRow[] = [
      { playerId: 1, name: "Player 1", goals: 0, assists: 0, ownGoals: 0 },
    ];

    const result = formatPeladaSummary(date, standings, playerStats);

    expect(result).toContain("Classificacao:");
    expect(result).not.toContain("Gols:");
    expect(result).not.toContain("Assistencias:");
  });
});
