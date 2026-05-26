import { describe, it, expect } from "vitest";
import { formatPeladaSummary } from "./formatSummary";
import type { StandingRow } from "../components/StandingsPanel";
import type { PlayerStatRow } from "../components/PlayerStatsPanel";

describe("formatPeladaSummary", () => {
  it("formats summary correctly with all data", () => {
    const date = "2024-05-25T12:00:00Z";
    const standings = [
      {
        name: "Team A",
        wins: 2,
        draws: 1,
        losses: 0,
        goalsFor: 5,
        goalsAgainst: 2,
        goalDifference: 3,
      },
      {
        name: "Team B",
        wins: 0,
        draws: 1,
        losses: 2,
        goalsFor: 2,
        goalsAgainst: 5,
        goalDifference: -3,
      },
    ];
    const playerStats = [
      { name: "Player 1", goals: 3, assists: 1, goalsConceded: undefined },
      { name: "Player 2", goals: 1, assists: 2, goalsConceded: undefined },
      { name: "GK A", goals: 0, assists: 0, goalsConceded: 5 },
      { name: "GK B", goals: 0, assists: 0, goalsConceded: 3 },
    ];

    const result = formatPeladaSummary(
      date,
      standings as StandingRow[],
      playerStats as PlayerStatRow[],
    );

    expect(result).toContain("Resumo da rodada 25/05");
    expect(result).toContain("Team A");
    expect(result).toContain("7 pts (2V 1E 0D) GP:5 SG:+3");
    expect(result).toContain("Team B");
    expect(result).toContain("1 pts (0V 1E 2D) GP:2 SG:-3");
    expect(result).toContain("Gols:");
    expect(result).toContain("Player 1");
    expect(result).toContain("Assistencias:");
    expect(result).toContain("Player 2");
    expect(result).toContain("Gols sofridos:");
    expect(result).toContain("GK B              3"); // Sorted by goals conceded ASC
    expect(result).toContain("GK A              5");
  });

  it("handles null date", () => {
    const result = formatPeladaSummary(null, [], []);
    expect(result).toContain("Resumo da rodada");
  });

  it("handles empty data", () => {
    const result = formatPeladaSummary("2024-05-25", [], []);
    expect(result).toContain("Classificacao:");
    expect(result).not.toContain("Gols:");
    expect(result).not.toContain("Assistencias:");
    expect(result).not.toContain("Gols sofridos:");
  });

  it("handles tie-breaking and zero goal difference", () => {
    const standings = [
      {
        name: "Team B",
        wins: 1,
        draws: 0,
        losses: 1,
        goalsFor: 1,
        goalsAgainst: 1,
        goalDifference: 0,
      },
      {
        name: "Team A",
        wins: 1,
        draws: 0,
        losses: 1,
        goalsFor: 2,
        goalsAgainst: 2,
        goalDifference: 0,
      },
    ];
    const playerStats = [
      { name: "Player B", goals: 1, assists: 1 },
      { name: "Player A", goals: 1, assists: 1 },
    ];
    const result = formatPeladaSummary(
      "2024-05-25T12:00:00Z",
      standings as StandingRow[],
      playerStats as PlayerStatRow[],
    );
    expect(result).toContain("Team A");
    expect(result).toContain("Team B");
    expect(result).toContain("Player A");
    expect(result).toContain("Player B");
  });

  it("handles long names for alignment", () => {
    const standings = [
      {
        name: "A very long team name that should be truncated or padded",
        wins: 1,
        draws: 0,
        losses: 0,
        goalsFor: 1,
        goalsAgainst: 0,
        goalDifference: 1,
      },
    ];
    const result = formatPeladaSummary(
      "2024-05-25",
      standings as StandingRow[],
      [],
    );
    expect(result).toContain("A very long team name");
  });
});
