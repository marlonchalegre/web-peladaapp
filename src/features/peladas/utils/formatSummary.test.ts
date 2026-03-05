import { describe, it, expect } from "vitest";
import { formatPeladaSummary } from "./formatSummary";
import { type StandingRow } from "../components/StandingsPanel";
import { type PlayerStatRow } from "../components/PlayerStatsPanel";

describe("formatPeladaSummary", () => {
  it("should format the summary correctly with full data", () => {
    const date = "2026-02-18T15:00:00Z";
    const standings: StandingRow[] = [
      {
        teamId: 3,
        name: "Time 3",
        wins: 5,
        draws: 1,
        losses: 0,
        goalsFor: 10,
        goalsAgainst: 2,
        goalDifference: 8,
      },
      {
        teamId: 2,
        name: "Time 2",
        wins: 1,
        draws: 3,
        losses: 2,
        goalsFor: 5,
        goalsAgainst: 7,
        goalDifference: -2,
      },
      {
        teamId: 1,
        name: "Time 1",
        wins: 0,
        draws: 2,
        losses: 4,
        goalsFor: 2,
        goalsAgainst: 8,
        goalDifference: -6,
      },
    ];
    const playerStats: PlayerStatRow[] = [
      {
        playerId: 1,
        name: "Chalegre",
        goals: 4,
        assists: 0,
        ownGoals: 0,
        goalsConceded: 2,
      },
      { playerId: 2, name: "C.Bala", goals: 3, assists: 0, ownGoals: 0 },
      { playerId: 3, name: "Rafa Lucena", goals: 0, assists: 2, ownGoals: 0 },
      { playerId: 4, name: "Igor", goals: 0, assists: 2, ownGoals: 0 },
      {
        playerId: 5,
        name: "Goalkeeper",
        goals: 0,
        assists: 0,
        ownGoals: 0,
        goalsConceded: 5,
      },
    ];

    const result = formatPeladaSummary(date, standings, playerStats);

    expect(result.startsWith("```")).toBe(true);
    expect(result.endsWith("```")).toBe(true);
    expect(result).toContain("Resumo da rodada 18/02");
    expect(result).toMatch(/Time 3\s+16 pts/);
    expect(result).toMatch(/Time 2\s+6 pts/);
    expect(result).toMatch(/Time 1\s+2 pts/);
    expect(result).toContain("Gols:");
    expect(result).toMatch(/Chalegre\s+4/);
    expect(result).toMatch(/C.Bala\s+3/);
    expect(result).toContain("Assistencias:");
    expect(result).toMatch(/Rafa Lucena\s+2/);
    expect(result).toMatch(/Igor\s+2/);
    expect(result).toContain("Gols sofridos:");
    expect(result).toMatch(/Chalegre\s+2/);
    expect(result).toMatch(/Goalkeeper\s+5/);
    // Should NOT contain the footnote artifacts
    expect(result).not.toContain("[1]");
  });

  it("should handle empty stats correctly", () => {
    const date = null;
    const standings: StandingRow[] = [];
    const playerStats: PlayerStatRow[] = [];

    const result = formatPeladaSummary(date, standings, playerStats);

    expect(result.startsWith("```")).toBe(true);
    expect(result.endsWith("```")).toBe(true);
    expect(result).toContain("Resumo da rodada");
    expect(result).toContain("Classificacao:");
    expect(result).not.toContain("Gols:");
    expect(result).not.toContain("Assistencias:");
  });

  it("should hide sections with zero values", () => {
    const date = "2026-02-18T15:00:00Z";
    const standings: StandingRow[] = [
      {
        teamId: 1,
        name: "Time 1",
        wins: 1,
        draws: 0,
        losses: 0,
        goalsFor: 2,
        goalsAgainst: 0,
        goalDifference: 2,
      },
    ];
    const playerStats: PlayerStatRow[] = [
      { playerId: 1, name: "Player 1", goals: 0, assists: 0, ownGoals: 0 },
    ];

    const result = formatPeladaSummary(date, standings, playerStats);

    expect(result.startsWith("```")).toBe(true);
    expect(result.endsWith("```")).toBe(true);
    expect(result).toContain("Classificacao:");
    expect(result).not.toContain("Gols:");
    expect(result).not.toContain("Assistencias:");
    expect(result).not.toContain("Gols sofridos:");
  });

  it("should show Gols sofridos even if zero", () => {
    const date = null;
    const standings: StandingRow[] = [];
    const playerStats: PlayerStatRow[] = [
      {
        playerId: 1,
        name: "GK",
        goals: 0,
        assists: 0,
        ownGoals: 0,
        goalsConceded: 0,
      },
    ];

    const result = formatPeladaSummary(date, standings, playerStats);

    expect(result.startsWith("```")).toBe(true);
    expect(result.endsWith("```")).toBe(true);
    expect(result).toContain("Gols sofridos:");
    expect(result).toMatch(/GK\s+0/);
  });

  it("should show goalkeepers even if they have no other stats (Bug #9)", () => {
    const date = null;
    const standings: StandingRow[] = [];
    const playerStats: PlayerStatRow[] = [
      {
        playerId: 1,
        name: "Only Goalkeeper",
        goals: 0,
        assists: 0,
        ownGoals: 0,
        goalsConceded: 10,
      },
      {
        playerId: 2,
        name: "Striker",
        goals: 5,
        assists: 2,
        ownGoals: 0,
        // goalsConceded is undefined for non-goalkeepers
      },
    ];

    const result = formatPeladaSummary(date, standings, playerStats);

    expect(result).toContain("Gols sofridos:");
    expect(result).toMatch(/Only Goalkeeper\s+10/);
  });
});
