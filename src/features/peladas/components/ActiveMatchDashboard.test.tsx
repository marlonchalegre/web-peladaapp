import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import ActiveMatchDashboard from "./ActiveMatchDashboard";
import type {
  Match,
  TeamPlayer,
  Player,
  Pelada,
} from "../../../shared/api/endpoints";
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

  const mockPelada: Pelada = {
    id: 1,
    organization_id: 1,
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
    pelada: mockPelada,
    homeTeamName: "Home Team",
    awayTeamName: "Away Team",
    homePlayers: mockHomePlayers,
    awayPlayers: mockAwayPlayers,
    orgPlayerIdToUserId: mockOrgPlayerIdToUserId,
    userIdToName: mockUserIdToName,
    orgPlayerIdToPlayer: {
      101: { id: 101, user_id: 1, organization_id: 1, position_id: 1 },
      201: { id: 201, user_id: 2, organization_id: 1, position_id: 2 },
    },
    statsMap: mockStatsMap,
    benchPlayers: [] as Player[],
    finished: false,
    isAdmin: false,
    updating: false,
    selectMenu: null,
    setSelectMenu: vi.fn(),
    onStartMatch: vi.fn(),
    onPauseMatch: vi.fn(),
    onResetMatch: vi.fn(),
    onOpenResetConfirm: vi.fn(),
    recordEvent: vi.fn(),
    deleteEventAndRefresh: vi.fn(),
    adjustScore: vi.fn(),
    replacePlayerOnTeam: vi.fn(),
    addPlayerToTeam: vi.fn(),
    onEndMatch: vi.fn(),
    matches: [mockMatch],
    onSelectMatch: vi.fn(),
    teamNameById: { 10: "Home Team", 20: "Away Team" },
  };

  it("renders team names and score", () => {
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard {...defaultProps} />
      </ThemeContextProvider>,
    );
    // There are multiple "HOME TEAM" mentions (header and section)
    expect(screen.getAllByText("HOME TEAM")[0]).toBeInTheDocument();
    expect(screen.getAllByText("AWAY TEAM")[0]).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  it("renders player names", () => {
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard {...defaultProps} />
      </ThemeContextProvider>,
    );
    expect(screen.getByText("Player One")).toBeInTheDocument();
    expect(screen.getByText("Player Two")).toBeInTheDocument();
  });

  it("shows finished status and allows editing if match is finished and pelada is open", async () => {
    const user = userEvent.setup();
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          finished={true}
          isAdmin={true}
        />
      </ThemeContextProvider>,
    );

    const editBtn = screen.getByText("peladas.dashboard.button.edit_match");
    expect(editBtn).toBeInTheDocument();

    await user.click(editBtn);
    expect(
      screen.getByText("peladas.dashboard.button.finish_editing"),
    ).toBeInTheDocument();
  });

  it("renders empty slots when teams are below playersPerTeam limit", () => {
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard {...defaultProps} playersPerTeam={5} />
      </ThemeContextProvider>,
    );

    // Each team has 1 player, limit is 5. Each team should have 4 empty slots.
    // Total empty slots = 8
    const emptySlots = screen.getAllByTestId("player-row-empty");
    expect(emptySlots.length).toBe(8);
  });

  it("renders empty slots to balance teams even if playersPerTeam is not set", () => {
    const unbalancedHomePlayers = [
      { team_id: 10, player_id: 101 },
      { team_id: 10, player_id: 102 },
    ];
    const unbalancedAwayPlayers = [{ team_id: 20, player_id: 201 }];

    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          homePlayers={unbalancedHomePlayers}
          awayPlayers={unbalancedAwayPlayers}
          playersPerTeam={undefined}
        />
      </ThemeContextProvider>,
    );

    // Away team has 1 player, Home has 2. Target count should be 2.
    // Away team should have 1 empty slot.
    const emptySlots = screen.getAllByTestId("player-row-empty");
    expect(emptySlots.length).toBe(1);
  });
});
