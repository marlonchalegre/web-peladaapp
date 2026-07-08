/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, within } from "@testing-library/react";
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
    id: "1",
    pelada_id: "1",
    sequence: 1,
    home_team_id: "10",
    away_team_id: "20",
    home_score: 2,
    away_score: 1,
    status: "running",
  };

  const mockPelada: Pelada = {
    id: "1",
    organization_id: "1",
    status: "running",
  };

  const mockHomePlayers: TeamPlayer[] = [{ team_id: "10", player_id: "101" }];
  const mockAwayPlayers: TeamPlayer[] = [{ team_id: "20", player_id: "201" }];

  const mockOrgPlayerIdToUserId = { "101": "1", "201": "2" };
  const mockUserIdToName = { "1": "Player One", "2": "Player Two" };
  const mockStatsMap = {
    "101": { goals: 1, assists: 0, ownGoals: 0 },
    "201": { goals: 0, assists: 1, ownGoals: 0 },
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
      101: { id: "101", user_id: "1", organization_id: "1", position_id: "1" },
      201: { id: "201", user_id: "2", organization_id: "1", position_id: "2" },
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

    // Using translation key regex to match localized text
    const editBtn = screen.getByText(/dashboard\.button\.edit_match/i);
    expect(editBtn).toBeInTheDocument();

    await user.click(editBtn);
    expect(
      screen.getByText(/dashboard\.button\.finish_editing/i),
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
      { team_id: "10", player_id: "101" },
      { team_id: "10", player_id: "102" },
    ];
    const unbalancedAwayPlayers = [{ team_id: "20", player_id: "201" }];

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

  it("renders correct number of empty slots when fixed_goalkeepers is enabled", () => {
    const fixedGkPelada: Pelada = {
      id: "1",
      organization_id: "1",
      status: "running",
      fixed_goalkeepers: true,
    };

    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          pelada={fixedGkPelada}
          playersPerTeam={6}
          homePlayers={[
            { team_id: "10", player_id: "101", is_goalkeeper: true }, // 1 fixed GK
            { team_id: "10", player_id: "102" },
            { team_id: "10", player_id: "103" },
            { team_id: "10", player_id: "104" },
            { team_id: "10", player_id: "105" },
            { team_id: "10", player_id: "106" }, // 5 field players
          ]}
          awayPlayers={[
            { team_id: "20", player_id: "201", is_goalkeeper: true }, // 1 fixed GK
            { team_id: "20", player_id: "202" },
            { team_id: "20", player_id: "203" },
            { team_id: "20", player_id: "204" },
            { team_id: "20", player_id: "205" },
            { team_id: "20", player_id: "206" }, // 5 field players
          ]}
        />
      </ThemeContextProvider>,
    );

    // Limit is 6 field players + 1 fixed GK = 7 total.
    // Each team has 6 players, so they each need 1 empty slot.
    // Total empty slots should be 2.
    const emptySlots = screen.getAllByTestId("player-row-empty");
    expect(emptySlots.length).toBe(2);
  });

  it("identifies and labels the next scheduled match correctly in history drawer", async () => {
    const user = userEvent.setup();
    const matches: Match[] = [
      {
        id: "1",
        pelada_id: "1",
        sequence: 1,
        home_team_id: "10",
        away_team_id: "20",
        home_score: 0,
        away_score: 0,
        status: "finished",
      },
      {
        id: "2",
        pelada_id: "1",
        sequence: 2,
        home_team_id: "30",
        away_team_id: "40",
        home_score: 0,
        away_score: 0,
        status: "scheduled",
      },
    ];

    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          match={matches[0]}
          matches={matches}
        />
      </ThemeContextProvider>,
    );

    // Open history drawer
    const historyBtn = screen.getByTestId("toggle-history-drawer");
    await user.click(historyBtn);

    // Sequence 2 should be labeled as "ATUAL" (Standardized in PT for Next if none running)
    // Actually we changed it to "ATUAL" for English "Current"
    expect(
      screen.getByText(/peladas\.matches\.status\.next/i),
    ).toBeInTheDocument();
  });

  it("shows next match pill when a scheduled match exists after current", () => {
    const matches: Match[] = [
      mockMatch,
      {
        id: "2",
        pelada_id: "1",
        sequence: 2,
        home_team_id: "30",
        away_team_id: "40",
        home_score: 0,
        away_score: 0,
        status: "scheduled",
      },
    ];

    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          match={matches[0]}
          matches={matches}
        />
      </ThemeContextProvider>,
    );

    expect(
      screen.getByText(/peladas\.dashboard\.summary\.next_up/i),
    ).toBeInTheDocument();
  });

  it("handles stat change: goal +1", async () => {
    const user = userEvent.setup();
    const recordEvent = vi.fn();
    const adjustScore = vi.fn();
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          isAdmin={true}
          recordEvent={recordEvent}
          adjustScore={adjustScore}
        />
      </ThemeContextProvider>,
    );

    const goalIncrement = screen.getAllByTestId("stat-goals-increment")[0];
    await user.click(goalIncrement);

    const withoutAssistanceOption = screen.getByTestId(
      "without-assistance-option",
    );
    await user.click(withoutAssistanceOption);

    expect(recordEvent).toHaveBeenCalledWith(
      "1",
      "101",
      "goal",
      undefined,
      undefined,
      undefined,
    );
    expect(adjustScore).toHaveBeenCalledWith("1", "home", 1);
  });

  it("handles stat change: goal -1", async () => {
    const user = userEvent.setup();
    const deleteEventAndRefresh = vi.fn();
    const adjustScore = vi.fn();
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          isAdmin={true}
          statsMap={{ 101: { goals: 1, assists: 0, ownGoals: 0 } }}
          deleteEventAndRefresh={deleteEventAndRefresh}
          adjustScore={adjustScore}
        />
      </ThemeContextProvider>,
    );

    const goalDecrement = screen.getAllByTestId("stat-goals-decrement")[0];
    await user.click(goalDecrement);

    expect(deleteEventAndRefresh).toHaveBeenCalledWith("1", "101", "goal");
    expect(adjustScore).toHaveBeenCalledWith("1", "home", -1);
  });

  it("handles stat change: own_goal +1 (flips side)", async () => {
    const user = userEvent.setup();
    const recordEvent = vi.fn();
    const adjustScore = vi.fn();
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          isAdmin={true}
          recordEvent={recordEvent}
          adjustScore={adjustScore}
        />
      </ThemeContextProvider>,
    );

    const ownGoalIncrement = screen.getAllByTestId(
      "stat-own-goals-increment",
    )[0];
    await user.click(ownGoalIncrement);

    expect(recordEvent).toHaveBeenCalledWith(
      "1",
      "101",
      "own_goal",
      undefined,
      undefined,
    );
    expect(adjustScore).toHaveBeenCalledWith("1", "away", 1);
  });

  it("opens sub menu on player click and handles replacement", async () => {
    const user = userEvent.setup();
    const setSelectMenu = vi.fn();
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          isAdmin={true}
          setSelectMenu={setSelectMenu}
        />
      </ThemeContextProvider>,
    );

    const subBtn = screen.getAllByTestId("sub-button")[0];
    await user.click(subBtn);

    expect(setSelectMenu).toHaveBeenCalledWith({
      teamId: "10",
      forPlayerId: "101",
      type: "replace",
    });
  });

  it("opens sub menu on empty slot and handles adding", async () => {
    const user = userEvent.setup();
    const setSelectMenu = vi.fn();
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          isAdmin={true}
          playersPerTeam={2}
          setSelectMenu={setSelectMenu}
        />
      </ThemeContextProvider>,
    );

    // Find the add button in the empty slot
    const emptySlot = screen.getAllByTestId("player-row-empty")[0];
    const addBtn = within(emptySlot).getByRole("button");
    await user.click(addBtn);

    expect(setSelectMenu).toHaveBeenCalledWith({
      teamId: "10",
      forPlayerId: expect.any(String),
      type: "add",
    });
  });

  it("renders PlayerSelectMenu and calls addPlayerToTeam", async () => {
    const user = userEvent.setup();
    const addPlayerToTeam = vi.fn();
    const benchPlayers = [
      { id: "b1", user_id: "u3", organization_id: "1", position_id: "1" },
    ];
    const setSelectMenu = vi.fn();

    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          selectMenu={{ teamId: "10", type: "add" }}
          benchPlayers={benchPlayers as any}
          addPlayerToTeam={addPlayerToTeam}
          setSelectMenu={setSelectMenu}
          orgPlayerIdToUserId={{ ...mockOrgPlayerIdToUserId, b1: "u3" }}
          userIdToName={{ ...mockUserIdToName, u3: "Bench Player" }}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("Bench Player")).toBeInTheDocument();
    await user.click(screen.getByText("Bench Player"));

    expect(addPlayerToTeam).toHaveBeenCalledWith("10", "b1");
  });

  it("renders PlayerSelectMenu and calls replacePlayerOnTeam", async () => {
    const user = userEvent.setup();
    const replacePlayerOnTeam = vi.fn();
    const benchPlayers = [
      { id: "b1", user_id: "u3", organization_id: "1", position_id: "1" },
    ];

    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          selectMenu={{ teamId: "10", forPlayerId: "101", type: "replace" }}
          benchPlayers={benchPlayers as any}
          replacePlayerOnTeam={replacePlayerOnTeam}
          orgPlayerIdToUserId={{ ...mockOrgPlayerIdToUserId, b1: "u3" }}
          userIdToName={{ ...mockUserIdToName, u3: "Bench Player" }}
        />
      </ThemeContextProvider>,
    );

    await user.click(screen.getByText("Bench Player"));
    expect(replacePlayerOnTeam).toHaveBeenCalledWith("10", "101", "b1");
  });

  it("handles stat change: own_goal -1 (flips side)", async () => {
    const user = userEvent.setup();
    const deleteEventAndRefresh = vi.fn();
    const adjustScore = vi.fn();
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          isAdmin={true}
          statsMap={{ 101: { goals: 0, assists: 0, ownGoals: 1 } }}
          deleteEventAndRefresh={deleteEventAndRefresh}
          adjustScore={adjustScore}
        />
      </ThemeContextProvider>,
    );

    const ownGoalDecrement = screen.getAllByTestId(
      "stat-own-goals-decrement",
    )[0];
    await user.click(ownGoalDecrement);

    expect(deleteEventAndRefresh).toHaveBeenCalledWith("1", "101", "own_goal");
    expect(adjustScore).toHaveBeenCalledWith("1", "away", -1);
  });

  it("handles clicking a match in the history drawer", async () => {
    const onSelectMatch = vi.fn();
    const user = userEvent.setup();
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard {...defaultProps} onSelectMatch={onSelectMatch} />
      </ThemeContextProvider>,
    );

    await user.click(screen.getByTestId("toggle-history-drawer"));
    const historyItem = screen.getByTestId("match-history-item-1");
    await user.click(historyItem);

    expect(onSelectMatch).toHaveBeenCalledWith("1");
  });

  it("shows running status in history drawer", async () => {
    const user = userEvent.setup();
    const matches: Match[] = [{ ...mockMatch, status: "running" }];
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          match={matches[0]}
          matches={matches}
        />
      </ThemeContextProvider>,
    );

    await user.click(screen.getByTestId("toggle-history-drawer"));
    expect(
      screen.getByText(/peladas\.matches\.status\.running/i),
    ).toBeInTheDocument();
  });

  it("renders inline record event button for admin when match is not finished", async () => {
    const user = userEvent.setup();
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          isAdmin={true}
          finished={false}
        />
      </ThemeContextProvider>,
    );

    const inlineBtn = screen.getByTestId("record-event-inline-button");
    expect(inlineBtn).toBeInTheDocument();

    await user.click(inlineBtn);

    expect(screen.getByTestId("record-event-dialog")).toBeInTheDocument();
  });
});
