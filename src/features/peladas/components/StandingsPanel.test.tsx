import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StandingsPanel, { type StandingRow } from "./StandingsPanel";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import type { Match } from "../../../shared/api/endpoints";

describe("StandingsPanel", () => {
  const mockStandings: StandingRow[] = [
    {
      teamId: "1",
      name: "Champions",
      wins: 2,
      draws: 1,
      losses: 0,
      goalsFor: 5,
      goalsAgainst: 2,
      goalDifference: 3,
    },
    {
      teamId: "2",
      name: "Runners Up",
      wins: 1,
      draws: 1,
      losses: 1,
      goalsFor: 3,
      goalsAgainst: 3,
      goalDifference: 0,
    },
  ];

  it("renders standings table correctly", () => {
    render(
      <ThemeContextProvider>
        <StandingsPanel standings={mockStandings} />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("common.points_short")).toBeInTheDocument();
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument(); // Champions Points: 2*3 + 1 = 7
    expect(screen.getByText("Runners Up")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument(); // Runners Up Points: 1*3 + 1 = 4
    expect(screen.getByText("5")).toBeInTheDocument(); // GP
    expect(screen.getByText("+3")).toBeInTheDocument(); // SG
  });

  it("shows champion highlight when showHighlights is true", () => {
    render(
      <ThemeContextProvider>
        <StandingsPanel standings={mockStandings} showHighlights={true} />
      </ThemeContextProvider>,
    );

    // Should show common.champion and team name
    expect(screen.getByText(/common\.champion/i)).toBeInTheDocument();
    const highlightTeam = screen.getAllByText("Champions")[0];
    expect(highlightTeam).toBeInTheDocument();
    expect(screen.getByText("2V 1E 0D")).toBeInTheDocument();
  });

  it("does NOT show champion highlight if no games won/drawn", () => {
    const zeroStandings: StandingRow[] = [
      {
        teamId: "1",
        name: "No Games",
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      },
    ];

    render(
      <ThemeContextProvider>
        <StandingsPanel standings={zeroStandings} showHighlights={true} />
      </ThemeContextProvider>,
    );

    expect(screen.queryByText(/common\.champion/i)).not.toBeInTheDocument();
  });

  it("shows champion trophy icon next to champion team name in standings table when mathematically champion", () => {
    render(
      <ThemeContextProvider>
        <StandingsPanel standings={mockStandings} />
      </ThemeContextProvider>,
    );

    const trophy = screen.getByTestId("champion-trophy-icon");
    expect(trophy).toBeInTheDocument();
  });

  it("does NOT show champion trophy icon when remaining matches allow competitors to tie or pass leader", () => {
    const inProgressMatches = [
      {
        id: "m1",
        home_team_id: "1",
        away_team_id: "2",
        home_score: 2,
        away_score: 1,
        status: "finished",
      },
      {
        id: "m2",
        home_team_id: "2",
        away_team_id: "1",
        home_score: 0,
        away_score: 0,
        status: "scheduled",
      },
    ] as unknown as Match[];

    render(
      <ThemeContextProvider>
        <StandingsPanel
          standings={mockStandings}
          matches={inProgressMatches}
          showHighlights={false}
        />
      </ThemeContextProvider>,
    );

    expect(
      screen.queryByTestId("champion-trophy-icon"),
    ).not.toBeInTheDocument();
  });

  it("does NOT show champion trophy icon if teams are tied on points, GD and GF", () => {
    const tiedStandings: StandingRow[] = [
      {
        teamId: "1",
        name: "Team Alpha",
        wins: 1,
        draws: 1,
        losses: 0,
        goalsFor: 3,
        goalsAgainst: 1,
        goalDifference: 2,
        points: 4,
      },
      {
        teamId: "2",
        name: "Team Beta",
        wins: 1,
        draws: 1,
        losses: 0,
        goalsFor: 3,
        goalsAgainst: 1,
        goalDifference: 2,
        points: 4,
      },
    ];

    render(
      <ThemeContextProvider>
        <StandingsPanel standings={tiedStandings} showHighlights={true} />
      </ThemeContextProvider>,
    );

    expect(
      screen.queryByTestId("champion-trophy-icon"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/common\.champion/i)).not.toBeInTheDocument();
  });

  it("shows trophy icon when points are equal but team 1 has better goal difference", () => {
    const gdTiebreakStandings: StandingRow[] = [
      {
        teamId: "1",
        name: "Team GD Leader",
        wins: 1,
        draws: 0,
        losses: 1,
        goalsFor: 5,
        goalsAgainst: 2,
        goalDifference: 3,
        points: 3,
      },
      {
        teamId: "2",
        name: "Team GD Follower",
        wins: 1,
        draws: 0,
        losses: 1,
        goalsFor: 2,
        goalsAgainst: 1,
        goalDifference: 1,
        points: 3,
      },
    ];

    render(
      <ThemeContextProvider>
        <StandingsPanel standings={gdTiebreakStandings} showHighlights={true} />
      </ThemeContextProvider>,
    );

    expect(screen.getByTestId("champion-trophy-icon")).toBeInTheDocument();
    expect(screen.getByText(/common\.champion/i)).toBeInTheDocument();
  });

  it("shows trophy icon when points and GD are equal but team 1 has higher goals for", () => {
    const gfTiebreakStandings: StandingRow[] = [
      {
        teamId: "1",
        name: "Team GF Leader",
        wins: 1,
        draws: 0,
        losses: 0,
        goalsFor: 4,
        goalsAgainst: 2,
        goalDifference: 2,
        points: 3,
      },
      {
        teamId: "2",
        name: "Team GF Follower",
        wins: 1,
        draws: 0,
        losses: 0,
        goalsFor: 2,
        goalsAgainst: 0,
        goalDifference: 2,
        points: 3,
      },
    ];

    render(
      <ThemeContextProvider>
        <StandingsPanel standings={gfTiebreakStandings} showHighlights={true} />
      </ThemeContextProvider>,
    );

    expect(screen.getByTestId("champion-trophy-icon")).toBeInTheDocument();
    expect(screen.getByText(/common\.champion/i)).toBeInTheDocument();
  });

  it("handles single team tournament with at least one win", () => {
    const singleTeam: StandingRow[] = [
      {
        teamId: "solo",
        name: "Solo Team",
        wins: 1,
        draws: 0,
        losses: 0,
        goalsFor: 2,
        goalsAgainst: 0,
        goalDifference: 2,
        points: 3,
      },
    ];

    render(
      <ThemeContextProvider>
        <StandingsPanel standings={singleTeam} showHighlights={true} />
      </ThemeContextProvider>,
    );

    expect(screen.getByTestId("champion-trophy-icon")).toBeInTheDocument();
    expect(screen.getByText(/common\.champion/i)).toBeInTheDocument();
  });
});
