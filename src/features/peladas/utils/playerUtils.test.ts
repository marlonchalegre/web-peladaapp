/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { sortPlayersByPosition, getPlayerTeamInMatch } from "./playerUtils";

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
      expect(sorted[0].user.name).toBe("Goalkeeper A");
      expect(sorted[1].user.name).toBe("Defender A");
      expect(sorted[2].user.name).toBe("Midfielder A");
      expect(sorted[3].user.name).toBe("Striker A");
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
      expect(sorted[0].user.name).toBe("ST but is GK");
    });

    it("should sort alphabetically by name as a tie-breaker", () => {
      const samePos = [
        { id: "1", user: { name: "Charlie", position: "Midfielder" } },
        { id: "2", user: { name: "Alpha", position: "Midfielder" } },
        { id: "3", user: { name: "Bravo", position: "Midfielder" } },
      ] as any;
      const sorted = sortPlayersByPosition(samePos);
      expect(sorted[0].user.name).toBe("Alpha");
      expect(sorted[1].user.name).toBe("Bravo");
      expect(sorted[2].user.name).toBe("Charlie");
    });

    it("should put unknown positions at the end", () => {
      const unknown = [
        { id: "1", user: { name: "Unknown", position: "Waterboy" } },
        { id: "2", user: { name: "Striker", position: "Striker" } },
      ] as any;
      const sorted = sortPlayersByPosition(unknown);
      expect(sorted[0].user.name).toBe("Striker");
      expect(sorted[1].user.name).toBe("Unknown");
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
});
