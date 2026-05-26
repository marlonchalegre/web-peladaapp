import { describe, it, expect, vi, type Mock, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePeladaMatches } from "./usePeladaMatches";
import { usePeladaData } from "./usePeladaData";

// Mock hooks
vi.mock("./usePeladaData", () => ({
  usePeladaData: vi.fn(),
}));

vi.mock("./usePeladaStandings", () => ({
  usePeladaStandings: vi.fn(() => ({})),
}));

const mockActions = {
  executeEndMatch: vi.fn(),
  startMatchTimer: vi.fn(),
  startPeladaTimer: vi.fn(),
  pauseMatchTimer: vi.fn(),
  pausePeladaTimer: vi.fn(),
};

vi.mock("./useMatchActions", () => ({
  useMatchActions: vi.fn(() => mockActions),
}));

describe("usePeladaMatches", () => {
  const mockData = {
    loading: false,
    error: null,
    matches: [
      { id: "m1", home_team_id: "t1", away_team_id: "t2", status: "running" },
      { id: "m2", home_team_id: "t1", away_team_id: "t3", status: "scheduled" },
    ],
    matchesRef: { current: [] },
    teams: [
      { id: "t1", name: "Team 1" },
      { id: "t2", name: "Team 2" },
      { id: "t3", name: "Team 3" },
    ],
    pelada: { id: "p1", status: "running", timer_status: "running" },
    teamPlayers: { t1: [], t2: [], t3: [] },
    lineupsByMatch: { m1: { t1: [], t2: [] }, m2: { t1: [], t3: [] } },
    orgPlayerIdToUserId: {},
    userIdToName: {},
    orgPlayerIdToPlayer: {
      p1: { id: "p1", name: "Player 1" },
    },
    matchEvents: [],
    playerStatsFromApi: null,
    attendance: [{ player_id: "p1", status: "confirmed" }],
    refreshData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (usePeladaData as Mock).mockReturnValue({
      ...mockData,
      matchesRef: { current: mockData.matches },
    });
  });

  it("should initialize with selected match", () => {
    const { result } = renderHook(() => usePeladaMatches("p1"));
    expect(result.current.selectedMatchId).toBe("m1");
  });

  it("should handle endMatch", async () => {
    const { result } = renderHook(() => usePeladaMatches("p1"));

    await act(async () => {
      await result.current.endMatch("m1");
    });

    expect(mockActions.executeEndMatch).toHaveBeenCalledWith("m1");
    expect(result.current.justFinishedMatch?.id).toBe("m1");
  });

  it("should handle proceedToNextMatch", async () => {
    const { result } = renderHook(() => usePeladaMatches("p1"));

    await act(async () => {
      await result.current.proceedToNextMatch();
    });

    expect(result.current.selectedMatchId).toBe("m2");
    expect(mockActions.startMatchTimer).toHaveBeenCalledWith("m2");
  });

  it("should handle endMatch and stop timers if no more matches", async () => {
    // Override mockData to have only one match
    (usePeladaData as Mock).mockReturnValue({
      ...mockData,
      matches: [mockData.matches[0]],
      matchesRef: { current: [mockData.matches[0]] },
    });

    const { result } = renderHook(() => usePeladaMatches("p1"));

    await act(async () => {
      await result.current.endMatch("m1");
    });

    expect(mockActions.pauseMatchTimer).toHaveBeenCalledWith("m1");
    expect(mockActions.pausePeladaTimer).toHaveBeenCalled();
  });

  it("should handle proceedToNextMatch and start pelada timer if not running", async () => {
    (usePeladaData as Mock).mockReturnValue({
      ...mockData,
      pelada: { ...mockData.pelada, timer_status: "stopped" },
      matchesRef: { current: mockData.matches },
    });

    const { result } = renderHook(() => usePeladaMatches("p1"));

    await act(async () => {
      await result.current.proceedToNextMatch();
    });

    expect(mockActions.startPeladaTimer).toHaveBeenCalled();
  });
});
