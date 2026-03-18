import { describe, it, expect, vi, type Mock } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePeladaMatches } from "./usePeladaMatches";
import { usePeladaData } from "./usePeladaData";

// Mock usePeladaData
vi.mock("./usePeladaData", () => ({
  usePeladaData: vi.fn(),
}));

describe("usePeladaMatches", () => {
  it("should filter benchPlayers to only include confirmed attendance players", () => {
    const mockData = {
      loading: false,
      error: null,
      matches: [
        { id: 1, home_team_id: 10, away_team_id: 20, status: "running" },
      ],
      matchesRef: { current: [] },
      teams: [],
      pelada: { id: 1, status: "running" },
      teamPlayers: {},
      lineupsByMatch: {},
      orgPlayerIdToUserId: {},
      userIdToName: {},
      orgPlayerIdToPlayer: {
        1: { id: 1, name: "Confirmed Player" },
        2: { id: 2, name: "Not Confirmed Player" },
        3: { id: 3, name: "Declined Player" },
      },
      matchEvents: [],
      playerStatsFromApi: null,
      attendance: [
        { player_id: 1, status: "confirmed" },
        { player_id: 3, status: "declined" },
      ],
      refreshData: vi.fn(),
    };

    (usePeladaData as Mock).mockReturnValue(mockData);

    const { result } = renderHook(() => usePeladaMatches(1));

    // Check bench players in activeMatchData
    const benchPlayers = result.current.activeMatchData?.benchPlayers;
    expect(benchPlayers).toBeDefined();
    // Should only contain player 1
    expect(benchPlayers?.length).toBe(1);
    expect(benchPlayers?.[0].id).toBe(1);
  });

  it("should handle status case-insensitivity and ID as number/string", () => {
    const mockData = {
      loading: false,
      error: null,
      matches: [
        { id: 1, home_team_id: 10, away_team_id: 20, status: "running" },
      ],
      matchesRef: { current: [] },
      teams: [],
      pelada: { id: 1, status: "running" },
      teamPlayers: {},
      lineupsByMatch: {},
      orgPlayerIdToUserId: {},
      userIdToName: {},
      orgPlayerIdToPlayer: {
        1: { id: 1, name: "Confirmed 1" },
        2: { id: 2, name: "Confirmed 2" },
      },
      matchEvents: [],
      playerStatsFromApi: null,
      attendance: [
        { player_id: "1", status: "CONFIRMED" }, // string ID and uppercase
        { player_id: 2, status: "confirmed " }, // space
      ],
      refreshData: vi.fn(),
    };

    (usePeladaData as Mock).mockReturnValue(mockData);

    const { result } = renderHook(() => usePeladaMatches(1));

    const benchPlayers = result.current.activeMatchData?.benchPlayers;
    expect(benchPlayers?.length).toBe(2);
  });

  it("should fallback to all players if attendance is empty", () => {
    const mockData = {
      loading: false,
      error: null,
      matches: [
        { id: 1, home_team_id: 10, away_team_id: 20, status: "running" },
      ],
      matchesRef: { current: [] },
      teams: [],
      pelada: { id: 1, status: "running" },
      teamPlayers: {},
      lineupsByMatch: {},
      orgPlayerIdToUserId: {},
      userIdToName: {},
      orgPlayerIdToPlayer: {
        1: { id: 1, name: "Player 1" },
        2: { id: 2, name: "Player 2" },
      },
      matchEvents: [],
      playerStatsFromApi: null,
      attendance: [],
      refreshData: vi.fn(),
    };

    (usePeladaData as Mock).mockReturnValue(mockData);

    const { result } = renderHook(() => usePeladaMatches(1));

    const benchPlayers = result.current.activeMatchData?.benchPlayers;
    // Size 0 fallback logic: if confirmedPlayerIds.size === 0, it shows all
    expect(benchPlayers?.length).toBe(2);
  });
});
