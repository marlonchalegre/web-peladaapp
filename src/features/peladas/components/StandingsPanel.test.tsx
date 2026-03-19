import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StandingsPanel, { type StandingRow } from "./StandingsPanel";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

describe("StandingsPanel", () => {
  const mockStandings: StandingRow[] = [
    {
      teamId: 1,
      name: "Champions",
      wins: 2,
      draws: 1,
      losses: 0,
      goalsFor: 5,
      goalsAgainst: 2,
      goalDifference: 3,
    },
    {
      teamId: 2,
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

    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.getByText("Runners Up")).toBeInTheDocument();
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
        teamId: 1,
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
});
