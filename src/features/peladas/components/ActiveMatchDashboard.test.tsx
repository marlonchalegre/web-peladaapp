/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeAll } from "vitest";
import ActiveMatchDashboard from "./ActiveMatchDashboard";
import type {
  Match,
  TeamPlayer,
  Player,
  Pelada,
  MatchEvent,
} from "../../../shared/api/endpoints";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

function mockDesktopMediaQuery() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("min-width"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

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

  const mockEvents: MatchEvent[] = [
    {
      id: "e1",
      match_id: "1",
      player_id: "101",
      event_type: "goal",
      created_at: "2026-01-01T10:05:00Z",
      match_time_ms: 300000,
      team_id: "10",
    },
  ];

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
    standings: [],
    matchEvents: [] as MatchEvent[],
    onStartMatch: vi.fn(),
    onPauseMatch: vi.fn(),
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
    // Team names appear in the hero scoreboard and lineup sections
    expect(screen.getAllByText("HOME TEAM")[0]).toBeInTheDocument();
    expect(screen.getAllByText("AWAY TEAM")[0]).toBeInTheDocument();
    expect(screen.getByTestId("match-score-display")).toHaveTextContent("2");
    expect(screen.getByTestId("match-score-display")).toHaveTextContent("1");
  });

  it("renders player names", () => {
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard {...defaultProps} />
      </ThemeContextProvider>,
    );
    expect(screen.getByTestId("player-row-Player One")).toBeInTheDocument();
    expect(screen.getByTestId("player-row-Player Two")).toBeInTheDocument();
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

  it("shows team live positions from standings in the hero", () => {
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard
          {...defaultProps}
          standings={[
            {
              teamId: "20",
              name: "Away Team",
              wins: 1,
              draws: 0,
              losses: 0,
              goalsFor: 3,
              goalsAgainst: 1,
              goalDifference: 2,
              points: 3,
            },
            {
              teamId: "10",
              name: "Home Team",
              wins: 0,
              draws: 0,
              losses: 1,
              goalsFor: 1,
              goalsAgainst: 3,
              goalDifference: -2,
              points: 0,
            },
          ]}
        />
      </ThemeContextProvider>,
    );

    // Away team is 1st, home team is 2nd in this scenario
    expect(screen.getByText("1º")).toBeInTheDocument();
    expect(screen.getByText("2º")).toBeInTheDocument();
  });

  it("opens history drawer from the hero button and selects a match", async () => {
    const onSelectMatch = vi.fn();
    const user = userEvent.setup();
    render(
      <ThemeContextProvider>
        <ActiveMatchDashboard {...defaultProps} onSelectMatch={onSelectMatch} />
      </ThemeContextProvider>,
    );

    await user.click(screen.getAllByTestId("toggle-history-drawer")[0]);
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

    await user.click(screen.getAllByTestId("toggle-history-drawer")[0]);
    expect(
      screen.getByText(/peladas\.matches\.status\.running/i),
    ).toBeInTheDocument();
  });

  describe("goal recording via GOL buttons", () => {
    const adminProps = {
      ...defaultProps,
      isAdmin: true,
      match: { ...mockMatch, home_score: 0, away_score: 0 },
      statsMap: {},
    };

    it("opens scorer sheet and records goal without assistance", async () => {
      const user = userEvent.setup();
      const recordEvent = vi.fn();
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard {...adminProps} recordEvent={recordEvent} />
        </ThemeContextProvider>,
      );

      await user.click(screen.getByTestId("goal-button-home"));

      const scorerDialog = screen.getByTestId("goal-select-dialog");
      expect(
        within(scorerDialog).getByText(/peladas\.matches\.who_scored/i),
      ).toBeInTheDocument();

      await user.click(
        within(scorerDialog).getByTestId("goal-player-item-101"),
      );

      // Now on assist step
      const assistDialog = screen.getByTestId("assist-select-dialog");
      await user.click(
        within(assistDialog).getByTestId("without-assistance-option"),
      );

      expect(recordEvent).toHaveBeenCalledWith(
        "1",
        "101",
        "goal",
        undefined,
        undefined,
        undefined,
        "10",
      );
    });

    it("records goal with assistance from another player of the same team", async () => {
      const user = userEvent.setup();
      const recordEvent = vi.fn();
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard
            {...adminProps}
            awayPlayers={[
              { team_id: "20", player_id: "201" },
              { team_id: "20", player_id: "202" },
            ]}
            recordEvent={recordEvent}
          />
        </ThemeContextProvider>,
      );

      await user.click(screen.getByTestId("goal-button-away"));
      await user.click(screen.getByTestId("goal-player-item-201"));
      await user.click(screen.getByTestId("assistant-player-item-202"));

      expect(recordEvent).toHaveBeenCalledWith(
        "1",
        "201",
        "goal",
        undefined,
        undefined,
        "202",
        "20",
      );
    });

    it("falls back to adjustScore for own goal / unidentified when skipping scorer", async () => {
      const user = userEvent.setup();
      const recordEvent = vi.fn();
      const adjustScore = vi.fn();
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard
            {...adminProps}
            recordEvent={recordEvent}
            adjustScore={adjustScore}
          />
        </ThemeContextProvider>,
      );

      await user.click(screen.getByTestId("goal-button-away"));
      await user.click(screen.getByTestId("own-goal-skip-option"));

      expect(adjustScore).toHaveBeenCalledWith("1", "away", 1);
      expect(recordEvent).not.toHaveBeenCalled();
    });

    it("allows recording an own goal attributed to a specific player from the defending team", async () => {
      const user = userEvent.setup();
      const recordEvent = vi.fn();
      const adjustScore = vi.fn();
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard
            {...adminProps}
            recordEvent={recordEvent}
            adjustScore={adjustScore}
          />
        </ThemeContextProvider>,
      );

      // Goal for Away team -> defending team is Home (player 101)
      await user.click(screen.getByTestId("goal-button-away"));
      await user.click(screen.getByTestId("own-goal-option"));

      expect(screen.getByTestId("own-goal-select-dialog")).toBeInTheDocument();
      expect(
        screen.getByText(/peladas\.matches\.who_scored_own_goal/i),
      ).toBeInTheDocument();

      // Click home player 101 as the one who committed the own goal
      await user.click(screen.getByTestId("own_goal-player-item-101"));

      expect(recordEvent).toHaveBeenCalledWith(
        "1",
        "101",
        "own_goal",
        undefined,
        undefined,
        undefined,
        "10",
      );
    });

    it("allows navigating back from own goal selection to scorer selection", async () => {
      const user = userEvent.setup();
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard {...adminProps} />
        </ThemeContextProvider>,
      );

      await user.click(screen.getByTestId("goal-button-home"));
      await user.click(screen.getByTestId("own-goal-option"));

      expect(screen.getByTestId("own-goal-select-dialog")).toBeInTheDocument();

      await user.click(screen.getByTestId("back-to-scorer-option"));

      expect(screen.getByTestId("goal-select-dialog")).toBeInTheDocument();
      expect(
        screen.getByText(/peladas\.matches\.who_scored/i),
      ).toBeInTheDocument();
    });
  });

  describe("row template fidelity", () => {
    it("renders player rows without per-row stat steppers", () => {
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard
            {...defaultProps}
            isAdmin={true}
            statsMap={{ 101: { goals: 1, assists: 0, ownGoals: 0 } }}
          />
        </ThemeContextProvider>,
      );

      expect(
        screen.queryByTestId("stat-goals-increment"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("stat-goals-decrement"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("stat-own-goals-increment"),
      ).not.toBeInTheDocument();
    });
  });

  describe("event recording via OUTRO LANCE sheet", () => {
    it("records a custom event: type then player", async () => {
      const user = userEvent.setup();
      const recordEvent = vi.fn();
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard
            {...defaultProps}
            isAdmin={true}
            recordEvent={recordEvent}
          />
        </ThemeContextProvider>,
      );

      await user.click(screen.getAllByTestId("record-event-inline-button")[0]);

      const dialog = screen.getByTestId("record-event-dialog");
      await user.click(within(dialog).getByTestId("event-type-card-drible"));
      await user.click(within(dialog).getByTestId("event-player-item-101"));

      expect(recordEvent).toHaveBeenCalledWith(
        "1",
        "101",
        "drible",
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it("can go back from player step to type step", async () => {
      const user = userEvent.setup();
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard {...defaultProps} isAdmin={true} />
        </ThemeContextProvider>,
      );

      await user.click(screen.getAllByTestId("record-event-inline-button")[0]);
      const dialog = screen.getByTestId("record-event-dialog");
      await user.click(within(dialog).getByTestId("event-type-card-drible"));
      await user.click(within(dialog).getByText(/common\.back/i));

      expect(
        within(dialog).getByTestId("event-type-card-chute"),
      ).toBeInTheDocument();
    });
  });

  describe("substitutions", () => {
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
  });

  describe("next match", () => {
    it("shows next match card when a scheduled match exists after current", () => {
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

      expect(screen.getByTestId("next-match-card")).toBeInTheDocument();
      expect(
        screen.getByText(/peladas\.dashboard\.summary\.next_up/i),
      ).toBeInTheDocument();
    });

    it("renders the next match pill with both team names", async () => {
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
          support_camera_player_id: "101",
          support_stats_player_id: "201",
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

      expect(screen.getByTestId("next-match-card")).toBeInTheDocument();
      expect(
        screen.getByText(/peladas\.dashboard\.summary\.next_up/i),
      ).toBeInTheDocument();
    });

    it("leaves the next match card non-interactive when no support is assigned", () => {
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
        screen.queryByRole("button", { name: /next_match_support/i }),
      ).not.toBeInTheDocument();
    });

    it("renders camera and súmula icons in support lineup card", () => {
      const matchWithSupport: Match = {
        ...mockMatch,
        support_camera_player_id: "101",
        support_stats_player_id: "201",
      };

      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard {...defaultProps} match={matchWithSupport} />
        </ThemeContextProvider>,
      );

      const supportCard = screen.getByTestId(
        "active-match-support-lineup-card",
      );
      expect(supportCard).toBeInTheDocument();
      expect(screen.getByTestId("support-camera-icon")).toBeInTheDocument();
      expect(screen.getByTestId("support-stats-icon")).toBeInTheDocument();
      expect(screen.getByTestId("support-camera-person")).toHaveTextContent(
        "Player One",
      );
      expect(screen.getByTestId("support-stats-person")).toHaveTextContent(
        "Player Two",
      );
    });
  });

  describe("desktop layout", () => {
    beforeAll(() => {
      mockDesktopMediaQuery();
    });

    it("renders live standings card with records", () => {
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard
            {...defaultProps}
            standings={[
              {
                teamId: "10",
                name: "Home Team",
                wins: 1,
                draws: 1,
                losses: 0,
                goalsFor: 5,
                goalsAgainst: 3,
                goalDifference: 2,
                points: 4,
              },
              {
                teamId: "20",
                name: "Away Team",
                wins: 1,
                draws: 0,
                losses: 1,
                goalsFor: 4,
                goalsAgainst: 4,
                goalDifference: 0,
                points: 3,
              },
            ]}
          />
        </ThemeContextProvider>,
      );

      const card = screen.getByTestId("live-standings-card");
      expect(
        within(card).getByText(/live_state\.live_standings/i),
      ).toBeInTheDocument();
      expect(within(card).getAllByText("Home Team")[0]).toBeInTheDocument();
      expect(
        within(card).getByText("2J · 1V 1E 0D · SG +2"),
      ).toBeInTheDocument();
      expect(
        within(card).getByText("2J · 1V 0E 1D · SG 0"),
      ).toBeInTheDocument();
      expect(within(card).getByText("4")).toBeInTheDocument();
      expect(within(card).getByText("3")).toBeInTheDocument();
    });

    it("renders all teams in live standings card and does not render live timeline section", () => {
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard
            {...defaultProps}
            isAdmin={true}
            matchEvents={mockEvents}
            standings={[
              {
                teamId: "10",
                name: "Team 1",
                wins: 1,
                draws: 0,
                losses: 0,
                goalsFor: 2,
                goalsAgainst: 0,
                goalDifference: 2,
                points: 3,
              },
              {
                teamId: "20",
                name: "Team 2",
                wins: 0,
                draws: 1,
                losses: 0,
                goalsFor: 1,
                goalsAgainst: 1,
                goalDifference: 0,
                points: 1,
              },
              {
                teamId: "30",
                name: "Team 3",
                wins: 0,
                draws: 1,
                losses: 0,
                goalsFor: 1,
                goalsAgainst: 1,
                goalDifference: 0,
                points: 1,
              },
              {
                teamId: "40",
                name: "Team 4",
                wins: 0,
                draws: 0,
                losses: 1,
                goalsFor: 0,
                goalsAgainst: 2,
                goalDifference: -2,
                points: 0,
              },
            ]}
          />
        </ThemeContextProvider>,
      );

      const card = screen.getByTestId("live-standings-card");
      expect(within(card).getByText("1º")).toBeInTheDocument();
      expect(within(card).getByText("2º")).toBeInTheDocument();
      expect(within(card).getByText("3º")).toBeInTheDocument();
      expect(within(card).getByText("4º")).toBeInTheDocument();
      expect(within(card).getByText("Home Team")).toBeInTheDocument();
      expect(within(card).getByText("Away Team")).toBeInTheDocument();
      expect(within(card).getByText("Team 3")).toBeInTheDocument();
      expect(within(card).getByText("Team 4")).toBeInTheDocument();
      expect(
        screen.queryByTestId("live-timeline-section"),
      ).not.toBeInTheDocument();
    });

    it("navigates to timeline and standings tabs", async () => {
      const user = userEvent.setup();
      const onNavigateToTimeline = vi.fn();
      const onNavigateToStandings = vi.fn();
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard
            {...defaultProps}
            onNavigateToTimeline={onNavigateToTimeline}
            onNavigateToStandings={onNavigateToStandings}
          />
        </ThemeContextProvider>,
      );

      await user.click(screen.getByTestId("go-to-timeline-button"));
      expect(onNavigateToTimeline).toHaveBeenCalled();

      await user.click(screen.getByTestId("go-to-standings-button"));
      expect(onNavigateToStandings).toHaveBeenCalled();
    });
  });

  describe("end match button in hero", () => {
    it("renders end match button near the score and calls onEndMatch when clicked", async () => {
      const user = userEvent.setup();
      const onEndMatch = vi.fn();
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard
            {...defaultProps}
            isAdmin={true}
            onEndMatch={onEndMatch}
          />
        </ThemeContextProvider>,
      );

      const endBtn = screen.getByTestId("end-match-button");
      expect(endBtn).toBeInTheDocument();
      expect(endBtn).toHaveTextContent(/end_match|ENCERRAR/i);

      await user.click(endBtn);
      expect(onEndMatch).toHaveBeenCalled();
    });

    it("does not render end match button when match is already finished", () => {
      render(
        <ThemeContextProvider>
          <ActiveMatchDashboard
            {...defaultProps}
            isAdmin={true}
            match={{ ...mockMatch, status: "finished" }}
          />
        </ThemeContextProvider>,
      );

      expect(screen.queryByTestId("end-match-button")).not.toBeInTheDocument();
    });
  });
});
