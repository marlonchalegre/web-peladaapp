/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePeladaStandings, isMatchActive } from "./usePeladaStandings";

describe("usePeladaStandings", () => {
  const mockTeams = [
    { id: "t1", name: "Team A", pelada_id: "p1" },
    { id: "t2", name: "Team B", pelada_id: "p1" },
  ];
  const mockMatches = [
    {
      id: "m1",
      home_team_id: "t1",
      away_team_id: "t2",
      home_score: 2,
      away_score: 1,
      status: "finished",
    } as any,
  ];
  const mockEvents = [
    { player_id: "p1", event_type: "goal" },
    { player_id: "p2", event_type: "assist" },
    { player_id: "p3", event_type: "own_goal" },
  ] as any;

  it("should calculate standings correctly", () => {
    const { result } = renderHook(() =>
      usePeladaStandings(mockMatches, mockTeams, [], null, {}, {}, {}, {}, {}),
    );

    expect(result.current.standings).toHaveLength(2);
    const t1 = result.current.standings.find((s) => s.teamId === "t1");
    expect(t1?.wins).toBe(1);
    expect(t1?.goalsFor).toBe(2);
    expect(t1?.points).toBe(3); // wins * 3 + draws = 3
  });

  it("should handle draws and multiple matches", () => {
    const moreMatches = [
      ...mockMatches,
      {
        id: "m2",
        home_team_id: "t1",
        away_team_id: "t2",
        home_score: 1,
        away_score: 1,
        status: "finished",
      } as any,
    ];
    const { result } = renderHook(() =>
      usePeladaStandings(moreMatches, mockTeams, [], null, {}, {}, {}, {}, {}),
    );

    const t1 = result.current.standings.find((s) => s.teamId === "t1");
    expect(t1?.wins).toBe(1);
    expect(t1?.draws).toBe(1);
    expect(t1?.points).toBe(4); // wins * 3 + draws = 4
  });

  it("should aggregate stats from events if API stats are missing", () => {
    const { result } = renderHook(() =>
      usePeladaStandings([], [], mockEvents, null, {}, {}, {}, {}, {}),
    );

    expect(result.current.statsMap["p1"].goals).toBe(1);
    expect(result.current.statsMap["p2"].assists).toBe(1);
    expect(result.current.statsMap["p3"].ownGoals).toBe(1);
  });

  it("should calculate player stats including matches played and goals conceded for GK", () => {
    const teamPlayers = { t1: [{ player_id: "p1" }] } as any;
    const lineups = {
      m1: { t1: [{ player_id: "p1", is_goalkeeper: true }] },
    } as any;
    const { result } = renderHook(() =>
      usePeladaStandings(
        mockMatches,
        mockTeams,
        [],
        null,
        teamPlayers,
        lineups,
        {},
        {},
        {},
      ),
    );

    const p1Stats = result.current.playerStats.find((s) => s.playerId === "p1");
    expect(p1Stats?.matchesPlayed).toBe(1);
    expect(p1Stats?.goalsConceded).toBe(1);
  });

  it("should handle player sort and fallback name", () => {
    const apiStats = [
      { player_id: "p1", player_name: "A", goals: 1, assists: 0, own_goals: 0 },
      { player_id: "p2", player_name: "B", goals: 5, assists: 1, own_goals: 0 },
    ] as any;
    const { result } = renderHook(() =>
      usePeladaStandings([], [], [], apiStats, {}, {}, {}, {}, {}),
    );

    act(() => {
      result.current.togglePlayerSort("goals");
    });
    expect(result.current.playerStats[0].playerId).toBe("p2");

    act(() => {
      result.current.togglePlayerSort("assists");
    });
    expect(result.current.playerSort.by).toBe("assists");
    expect(result.current.playerStats[0].playerId).toBe("p2");
  });

  it("should handle tie-breakers in standings", () => {
    const teams = [
      { id: "t1", name: "A", pelada_id: "p1" },
      { id: "t2", name: "B", pelada_id: "p1" },
    ];
    const matches = [
      {
        id: "m1",
        home_team_id: "t1",
        away_team_id: "t2",
        home_score: 3,
        away_score: 1,
        status: "finished",
      } as any,
      {
        id: "m2",
        home_team_id: "t2",
        away_team_id: "t1",
        home_score: 2,
        away_score: 0,
        status: "finished",
      } as any,
    ];
    // Both 3 pts. T1: GD +1 (3-3), T2: GD +1 (3-3).
    // Wait, T1: 3-1 win, 0-2 loss. GD 0.
    // T2: 1-3 loss, 2-0 win. GD 0.
    // Same GD. T1 has 3 GF, T2 has 3 GF. Still tied.

    const { result } = renderHook(() =>
      usePeladaStandings(matches, teams, [], null, {}, {}, {}, {}, {}),
    );
    expect(result.current.standings).toHaveLength(2);
  });

  it("should ignore matches with unknown team IDs", () => {
    const matches = [
      {
        id: "m1",
        home_team_id: "unknown",
        away_team_id: "t2",
        home_score: 1,
        away_score: 0,
        status: "finished",
      } as any,
    ];
    const { result } = renderHook(() =>
      usePeladaStandings(matches, mockTeams, [], null, {}, {}, {}, {}, {}),
    );
    // T2 should still be 0-0 since its opponent was unknown
    const t2 = result.current.standings.find((s) => s.teamId === "t2");
    expect(t2?.wins).toBe(0);
  });

  it("should calculate standings including running matches but ignoring scheduled matches", () => {
    const runningMatches = [
      {
        id: "m_running",
        home_team_id: "t1",
        away_team_id: "t2",
        home_score: 3,
        away_score: 2,
        status: "running",
      } as any,
      {
        id: "m_scheduled",
        home_team_id: "t1",
        away_team_id: "t2",
        home_score: 0,
        away_score: 0,
        status: "scheduled",
      } as any,
    ];
    const { result } = renderHook(() =>
      usePeladaStandings(
        runningMatches,
        mockTeams,
        [],
        null,
        {},
        {},
        {},
        {},
        {},
      ),
    );

    const t1 = result.current.standings.find((s) => s.teamId === "t1");
    expect(t1?.wins).toBe(1);
    expect(t1?.draws).toBe(0);
    expect(t1?.goalsFor).toBe(3);
    expect(t1?.goalsAgainst).toBe(2);
    expect(t1?.points).toBe(3);
  });

  it("should calculate player stats including running matches for matches played and goalkeeper goals conceded", () => {
    const runningMatches = [
      {
        id: "m_running",
        home_team_id: "t1",
        away_team_id: "t2",
        home_score: 3,
        away_score: 2,
        status: "running",
      } as any,
    ];
    const teamPlayers = { t1: [{ player_id: "p1" }] } as any;
    const lineups = {
      m_running: { t1: [{ player_id: "p1", is_goalkeeper: true }] },
    } as any;
    const { result } = renderHook(() =>
      usePeladaStandings(
        runningMatches,
        mockTeams,
        [],
        null,
        teamPlayers,
        lineups,
        {},
        {},
        {},
      ),
    );

    const p1Stats = result.current.playerStats.find((s) => s.playerId === "p1");
    expect(p1Stats?.matchesPlayed).toBe(1);
    expect(p1Stats?.goalsConceded).toBe(2);
  });

  it("should include matches where timer_status is running as an initial draw in standings", () => {
    const matches = [
      {
        id: "m_next",
        home_team_id: "t1",
        away_team_id: "t2",
        home_score: 0,
        away_score: 0,
        status: "scheduled",
        timer_status: "running",
      } as any,
    ];
    const { result } = renderHook(() =>
      usePeladaStandings(matches, mockTeams, [], null, {}, {}, {}, {}, {}),
    );

    const t1 = result.current.standings.find((s) => s.teamId === "t1");
    const t2 = result.current.standings.find((s) => s.teamId === "t2");
    expect(t1?.draws).toBe(1);
    expect(t1?.points).toBe(1);
    expect(t2?.draws).toBe(1);
    expect(t2?.points).toBe(1);
  });

  describe("isMatchActive", () => {
    it("should return true for finished matches", () => {
      expect(isMatchActive({ status: "finished" } as any)).toBe(true);
      expect(isMatchActive({ status: "FINISHED" } as any)).toBe(true);
    });

    it("should return true for running matches", () => {
      expect(isMatchActive({ status: "running" } as any)).toBe(true);
      expect(isMatchActive({ status: "RUNNING" } as any)).toBe(true);
    });

    it("should return true when timer_status is running even if status is scheduled", () => {
      expect(
        isMatchActive({ status: "scheduled", timer_status: "running" } as any),
      ).toBe(true);
    });

    it("should return true when paused with accumulated time > 0", () => {
      expect(
        isMatchActive({
          status: "scheduled",
          timer_status: "paused",
          timer_accumulated_ms: 5000,
        } as any),
      ).toBe(true);
    });

    it("should return false when paused but timer_accumulated_ms is 0", () => {
      expect(
        isMatchActive({
          status: "scheduled",
          timer_status: "paused",
          timer_accumulated_ms: 0,
        } as any),
      ).toBe(false);
    });

    it("should return false for scheduled match with stopped timer", () => {
      expect(
        isMatchActive({ status: "scheduled", timer_status: "stopped" } as any),
      ).toBe(false);
      expect(isMatchActive({ status: "scheduled" } as any)).toBe(false);
    });
  });
});
