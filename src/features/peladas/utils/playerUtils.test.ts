/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  sortPlayersByPosition,
  getPlayerTeamInMatch,
  isAssistForGoal,
  findMatchingAssistForGoal,
  resolvePlayerName,
  getAttendancePlayerId,
} from "./playerUtils";

describe("playerUtils", () => {
  describe("sortPlayersByPosition", () => {
    const players = [
      { id: "1", user: { name: "Striker A", position: "Striker" } },
      { id: "2", user: { name: "Defender A", position: "Defender" } },
      { id: "3", user: { name: "Goalkeeper A", position: "Goalkeeper" } },
      { id: "4", user: { name: "Midfielder A", position: "Midfielder" } },
    ] as any;

    it("should sort by standard position order (GK > DF > MF > ST)", () => {
      const sorted = sortPlayersByPosition(players);
      expect(sorted[0]?.user?.name).toBe("Goalkeeper A");
      expect(sorted[1]?.user?.name).toBe("Defender A");
      expect(sorted[2]?.user?.name).toBe("Midfielder A");
      expect(sorted[3]?.user?.name).toBe("Striker A");
    });

    it("should respect manual goalkeeper override (is_goalkeeper)", () => {
      const mixedPlayers = [
        {
          id: "1",
          is_goalkeeper: false,
          user: { name: "GK by position", position: "Goalkeeper" },
        },
        {
          id: "2",
          is_goalkeeper: true,
          user: { name: "ST but is GK", position: "Striker" },
        },
      ] as any;
      const sorted = sortPlayersByPosition(mixedPlayers);
      expect(sorted[0]?.user?.name).toBe("ST but is GK");
    });

    it("should respect isGoalkeeper camelCase flag and tie-break multiple goalkeepers by name", () => {
      const gkPlayers = [
        { id: "1", name: "Zack GK", isGoalkeeper: true },
        { id: "2", name: "Adam GK", isGoalkeeper: true },
        {
          id: "3",
          name: "Bob Mid",
          isGoalkeeper: false,
          position: "midfielder",
        },
      ];
      const sorted = sortPlayersByPosition(gkPlayers);
      expect(sorted[0]?.name).toBe("Adam GK");
      expect(sorted[1]?.name).toBe("Zack GK");
      expect(sorted[2]?.name).toBe("Bob Mid");
    });

    it("should handle uppercase and mixed-case position strings", () => {
      const playersWithCasing = [
        { id: "1", name: "Striker", position: "STRIKER" },
        { id: "2", name: "Goalkeeper", position: "GOALKEEPER" },
        { id: "3", name: "Defender", position: "DeFeNdEr" },
      ];
      const sorted = sortPlayersByPosition(playersWithCasing);
      expect(sorted[0]?.name).toBe("Goalkeeper");
      expect(sorted[1]?.name).toBe("Defender");
      expect(sorted[2]?.name).toBe("Striker");
    });

    it("should sort alphabetically by name as a tie-breaker", () => {
      const samePos = [
        { id: "1", user: { name: "Charlie", position: "Midfielder" } },
        { id: "2", user: { name: "Alpha", position: "Midfielder" } },
        { id: "3", user: { name: "Bravo", position: "Midfielder" } },
      ] as any;
      const sorted = sortPlayersByPosition(samePos);
      expect(sorted[0]?.user?.name).toBe("Alpha");
      expect(sorted[1]?.user?.name).toBe("Bravo");
      expect(sorted[2]?.user?.name).toBe("Charlie");
    });

    it("should put unknown positions at the end", () => {
      const unknown = [
        { id: "1", user: { name: "Unknown", position: "Waterboy" } },
        { id: "2", user: { name: "Striker", position: "Striker" } },
      ] as any;
      const sorted = sortPlayersByPosition(unknown);
      expect(sorted[0]?.user?.name).toBe("Striker");
      expect(sorted[1]?.user?.name).toBe("Unknown");
    });
  });

  describe("getPlayerTeamInMatch", () => {
    const match = { home_team_id: "team-home", away_team_id: "team-away" };
    const matchId = "match-1";

    it("should return home_team_id if player is in home lineup", () => {
      const lineupsByMatch = {
        [matchId]: {
          "team-home": [{ player_id: "player-1" }],
          "team-away": [{ player_id: "player-2" }],
        },
      };
      const result = getPlayerTeamInMatch(
        "player-1",
        matchId,
        match,
        lineupsByMatch,
      );
      expect(result).toBe("team-home");
    });

    it("should return away_team_id if player is in away lineup", () => {
      const lineupsByMatch = {
        [matchId]: {
          "team-home": [{ player_id: "player-1" }],
          "team-away": [{ player_id: "player-2" }],
        },
      };
      const result = getPlayerTeamInMatch(
        "player-2",
        matchId,
        match,
        lineupsByMatch,
      );
      expect(result).toBe("team-away");
    });

    it("should fall back to teamPlayers if not in lineupsByMatch", () => {
      const lineupsByMatch = {
        [matchId]: {
          "team-home": [{ player_id: "player-1" }],
          "team-away": [],
        },
      };
      const teamPlayers = {
        "team-home": [{ player_id: "player-1" }],
        "team-away": [{ player_id: "player-2" }],
      };
      const result = getPlayerTeamInMatch(
        "player-2",
        matchId,
        match,
        lineupsByMatch,
        teamPlayers,
      );
      expect(result).toBe("team-away");
    });

    it("should fall back to orgPlayerIdToTeamId if not in lineups or teamPlayers", () => {
      const orgPlayerIdToTeamId = {
        "player-3": "team-away",
        "player-4": "team-other",
      };
      const result = getPlayerTeamInMatch(
        "player-3",
        matchId,
        match,
        {},
        {},
        orgPlayerIdToTeamId,
      );
      expect(result).toBe("team-away");
    });

    it("should ignore orgPlayerIdToTeamId if the global team is not playing in the match", () => {
      const orgPlayerIdToTeamId = {
        "player-4": "team-other",
      };
      const result = getPlayerTeamInMatch(
        "player-4",
        matchId,
        match,
        {},
        {},
        orgPlayerIdToTeamId,
      );
      expect(result).toBeNull();
    });

    it("should return null if player is not found anywhere", () => {
      const result = getPlayerTeamInMatch("player-999", matchId, match, {}, {});
      expect(result).toBeNull();
    });
  });

  describe("isAssistForGoal", () => {
    it("should match by parent_event_id", () => {
      const goal = { id: "g1", session_time_ms: 100, match_time_ms: 50 };
      const assist = {
        parent_event_id: "g1",
        session_time_ms: 200,
        match_time_ms: 150,
      };
      expect(isAssistForGoal(assist, goal)).toBe(true);
    });

    it("should match by matching timestamps when parent_event_id is missing", () => {
      const goal = { id: "g1", session_time_ms: 100, match_time_ms: 50 };
      const assist = {
        parent_event_id: null,
        session_time_ms: 100,
        match_time_ms: 50,
      };
      expect(isAssistForGoal(assist, goal)).toBe(true);
    });

    it("should not match if parent_event_id is different or timestamps differ", () => {
      const goal = { id: "g1", session_time_ms: 100, match_time_ms: 50 };
      const assistDiffParent = {
        parent_event_id: "g2",
        session_time_ms: 100,
        match_time_ms: 50,
      };
      const assistDiffTime = {
        parent_event_id: null,
        session_time_ms: 101,
        match_time_ms: 50,
      };
      expect(isAssistForGoal(assistDiffParent, goal)).toBe(false);
      expect(isAssistForGoal(assistDiffTime, goal)).toBe(false);
    });
  });

  describe("findMatchingAssistForGoal", () => {
    const goal = {
      id: "g1",
      match_id: "m1",
      event_type: "goal",
      session_time_ms: 100,
      match_time_ms: 50,
    } as any;

    it("should return null for non-goal events or null input", () => {
      expect(findMatchingAssistForGoal(null, [])).toBeNull();
      expect(
        findMatchingAssistForGoal({ ...goal, event_type: "own_goal" }, []),
      ).toBeNull();
    });

    it("should match by direct parent_event_id", () => {
      const events = [
        {
          id: "a1",
          match_id: "m1",
          event_type: "assist",
          parent_event_id: "g1",
          player_id: "p2",
        },
      ] as any[];
      expect(findMatchingAssistForGoal(goal, events)).toEqual(events[0]);
    });

    it("should match by timestamp when parent_event_id is not set", () => {
      const events = [
        {
          id: "a1",
          match_id: "m1",
          event_type: "assist",
          session_time_ms: 100,
          match_time_ms: 50,
          player_id: "p2",
        },
      ] as any[];
      expect(findMatchingAssistForGoal(goal, events)).toEqual(events[0]);
    });

    it("should prioritize same-team assist when multiple assists have identical timestamps", () => {
      const events = [
        {
          id: "a-team2",
          match_id: "m1",
          event_type: "assist",
          session_time_ms: 100,
          match_time_ms: 50,
          player_id: "p-away",
        },
        {
          id: "a-team1",
          match_id: "m1",
          event_type: "assist",
          session_time_ms: 100,
          match_time_ms: 50,
          player_id: "p-home",
        },
      ] as any[];
      const orgPlayerIdToTeamId = {
        "p-home": "team-home",
        "p-away": "team-away",
      };
      const result = findMatchingAssistForGoal(
        goal,
        events,
        "team-home",
        orgPlayerIdToTeamId,
      );
      expect(result?.id).toBe("a-team1");
    });

    it("prioritizes direct parent_event_id match over simultaneous assists", () => {
      const events = [
        {
          id: "a-wrong-time",
          match_id: "m1",
          event_type: "assist",
          parent_event_id: "g1",
          session_time_ms: 999,
          match_time_ms: 999,
          player_id: "p2",
        },
        {
          id: "a-same-time",
          match_id: "m1",
          event_type: "assist",
          session_time_ms: 100,
          match_time_ms: 50,
          player_id: "p3",
        },
      ] as any[];
      expect(findMatchingAssistForGoal(goal, events)).toEqual(events[0]);
    });

    it("ignores assists from a different match or with a different parent_event_id", () => {
      const events = [
        {
          id: "a-other-match",
          match_id: "other-m",
          event_type: "assist",
          session_time_ms: 100,
          match_time_ms: 50,
        },
        {
          id: "a-other-parent",
          match_id: "m1",
          event_type: "assist",
          parent_event_id: "other-goal",
          session_time_ms: 100,
          match_time_ms: 50,
        },
      ] as any[];
      expect(findMatchingAssistForGoal(goal, events)).toBeNull();
    });
  });

  describe("resolvePlayerName", () => {
    it("resolves name from orgPlayer.user_name", () => {
      const orgPlayers = { p1: { user_name: "Alice" } };
      expect(resolvePlayerName("p1", orgPlayers)).toBe("Alice");
    });

    it("resolves name from userIdToName using orgPlayerIdToUserId", () => {
      const rel = { p1: "u1" };
      const names = { u1: "Bob" };
      expect(resolvePlayerName("p1", undefined, rel, names)).toBe("Bob");
    });

    it("falls back to default fallback string", () => {
      expect(resolvePlayerName("p99")).toBe("Player #p99");
    });

    it("respects custom fallback parameter", () => {
      expect(
        resolvePlayerName(
          "p99",
          undefined,
          undefined,
          undefined,
          "Custom Name",
        ),
      ).toBe("Custom Name");
    });
  });

  describe("getAttendancePlayerId", () => {
    it("handles player_id", () => {
      expect(getAttendancePlayerId({ player_id: "p1" })).toBe("p1");
    });

    it("handles player-id and playerId", () => {
      expect(getAttendancePlayerId({ "player-id": "p2" })).toBe("p2");
      expect(getAttendancePlayerId({ playerId: "p3" })).toBe("p3");
    });

    it("returns undefined when no id property exists", () => {
      expect(getAttendancePlayerId({})).toBeUndefined();
    });
  });
});
