import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import ActiveMatchDashboard from "./ActiveMatchDashboard";
import type { Match, TeamPlayer, Player } from "../../../shared/api/endpoints";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

describe("ActiveMatchDashboard", () => {
  const mockMatch: Match = {
    id: 1,
    pelada_id: 1,
    sequence: 1,
    home_team_id: 10,
    away_team_id: 20,
    home_score: 2,
    away_score: 1,
    status: "running",
  };

  const mockHomePlayers: TeamPlayer[] = [{ team_id: 10, player_id: 101 }];
  const mockAwayPlayers: TeamPlayer[] = [{ team_id: 20, player_id: 201 }];

  const mockOrgPlayerIdToUserId = { 101: 1, 201: 2 };
  const mockUserIdToName = { 1: "Player One", 2: "Player Two" };
  const mockStatsMap = {
    101: { goals: 1, assists: 0, ownGoals: 0 },
    201: { goals: 0, assists: 1, ownGoals: 0 },
  };

  const defaultProps = {
    match: mockMatch,
    homeTeamName: "Home Team",
    awayTeamName: "Away Team",
    homePlayers: mockHomePlayers,
    awayPlayers: mockAwayPlayers,
    orgPlayerIdToUserId: mockOrgPlayerIdToUserId,
    userIdToName: mockUserIdToName,
    statsMap: mockStatsMap,
    benchPlayers: [] as Player[],
    finished: false,
    updating: false,
    selectMenu: null,
    setSelectMenu: vi.fn(),
    recordEvent: vi.fn(),
    deleteEventAndRefresh: vi.fn(),
    adjustScore: vi.fn(),
    replacePlayerOnTeam: vi.fn(),
    addPlayerToTeam: vi.fn(),
    onEndMatch: vi.fn(),
  };

  it("renders team names and score", () => {
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard {...defaultProps} />
      </ThemeContextProvider>,
    );
    expect(screen.getByText("Home Team")).toBeInTheDocument();
    expect(screen.getByText("Away Team")).toBeInTheDocument();
    expect(screen.getByText("2 x 1")).toBeInTheDocument();
  });

  it("renders player names and stats", () => {
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard {...defaultProps} />
      </ThemeContextProvider>,
    );
    expect(screen.getByText("Player One")).toBeInTheDocument();
    expect(screen.getByText("Player Two")).toBeInTheDocument();
    // Check table headers
    expect(screen.getByText("common.player")).toBeInTheDocument();
    expect(screen.getByText("common.goals")).toBeInTheDocument();
  });

  it("renders substitution buttons and stat inputs", () => {
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard {...defaultProps} />
      </ThemeContextProvider>,
    );

    // Total buttons expected:
    // 2 players
    // Per player:
    //  - 1 substitution button
    //  - 3 stats (goals, assists, ownGoals)
    //    - Each stat has 2 buttons (minus, plus)
    // Total = 2 * (1 + 3 * 2) = 14 buttons
    // + 1 End Match button
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(15);
  });
});
