import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMatchActions, type MatchStateDelegates } from "./useMatchActions";

const mockApi = vi.hoisted(() => ({
  updateMatchScore: vi.fn(),
  createMatchEvent: vi.fn(),
  deleteMatchEvent: vi.fn(),
  addMatchLineupPlayer: vi.fn(),
  removePlayerFromTeam: vi.fn(),
  closePelada: vi.fn(),
  endMatch: vi.fn(),
  startPeladaTimer: vi.fn(),
  pausePeladaTimer: vi.fn(),
  resetPeladaTimer: vi.fn(),
  startMatchTimer: vi.fn(),
  pauseMatchTimer: vi.fn(),
  resetMatchTimer: vi.fn(),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../../shared/api/endpoints", () => ({
  createApi: vi.fn(() => mockApi),
}));

vi.mock("../utils/offlineQueue", () => ({
  enqueueAction: vi.fn(),
}));

describe("useMatchActions", () => {
  const peladaId = "p1";
  let mockDelegates: MatchStateDelegates;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Ensure navigator.onLine is true for these tests
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
      writable: true,
    });

    mockDelegates = {
      matchesRef: { current: [{ id: "m1", home_score: 0, away_score: 0, status: "scheduled" }] as any },
      setMatches: vi.fn(),
      refreshData: vi.fn().mockResolvedValue(undefined),
      setError: vi.fn(),
      setMatchEvents: vi.fn(),
      setLineupsByMatch: vi.fn(),
      setPelada: vi.fn(),
    };

    // Default mock implementation to return a resolving promise
    Object.values(mockApi).forEach(m => (m as any).mockResolvedValue({}));
  });

  it("should initialize correctly", () => {
    const { result } = renderHook(() => useMatchActions(peladaId, mockDelegates));
    expect(result.current.closing).toBe(false);
    expect(result.current.selectMenu).toBe(null);
  });

  it("should adjustScore successfully (home goal)", async () => {
    const { result } = renderHook(() => useMatchActions(peladaId, mockDelegates));

    await act(async () => {
      await result.current.adjustScore("m1", "home", 1);
    });

    expect(mockDelegates.setMatches).toHaveBeenCalled();
    expect(mockApi.updateMatchScore).toHaveBeenCalledWith("m1", 1, 0, "running");
  });

  it("should handle adjustScore with negative score error", async () => {
    const { result } = renderHook(() => useMatchActions(peladaId, mockDelegates));

    await expect(act(async () => {
      await result.current.adjustScore("m1", "home", -1);
    })).rejects.toThrow("NEGATIVE_SCORE");

    expect(mockDelegates.setError).toHaveBeenCalledWith("peladas.matches.error.negative_score");
  });

  it("should recordEvent successfully", async () => {
    mockApi.createMatchEvent.mockResolvedValue({ id: "e1" });
    const { result } = renderHook(() => useMatchActions(peladaId, mockDelegates));

    await act(async () => {
      await result.current.recordEvent("m1", "pl1", "goal");
    });

    expect(mockApi.createMatchEvent).toHaveBeenCalledWith("m1", "pl1", "goal", undefined, undefined);
    expect(mockDelegates.refreshData).toHaveBeenCalled();
  });

  it("should deleteEvent successfully", async () => {
    const { result } = renderHook(() => useMatchActions(peladaId, mockDelegates));

    await act(async () => {
      await result.current.deleteEventAndRefresh("m1", "pl1", "goal");
    });

    expect(mockApi.deleteMatchEvent).toHaveBeenCalledWith("m1", "pl1", "goal");
    expect(mockDelegates.refreshData).toHaveBeenCalled();
  });

  it("should executeEndMatch successfully", async () => {
    const { result } = renderHook(() => useMatchActions(peladaId, mockDelegates));

    await act(async () => {
      await result.current.executeEndMatch("m1");
    });

    expect(mockApi.updateMatchScore).toHaveBeenCalledWith("m1", 0, 0, "finished");
    expect(mockDelegates.refreshData).toHaveBeenCalled();
  });

  it("should addPlayer to team successfully", async () => {
    const { result } = renderHook(() => useMatchActions(peladaId, mockDelegates));

    await act(async () => {
      await result.current.addPlayerToTeam("m1", "t1", "pl1");
    });

    expect(mockApi.addMatchLineupPlayer).toHaveBeenCalledWith("m1", "t1", "pl1");
    expect(mockDelegates.refreshData).toHaveBeenCalled();
  });

  it("should handle network error by enqueuing action", async () => {
    const networkError = new Error("Failed to fetch");
    mockApi.updateMatchScore.mockRejectedValue(networkError);
    const { result } = renderHook(() => useMatchActions(peladaId, mockDelegates));

    const { enqueueAction } = await import("../utils/offlineQueue");

    await act(async () => {
      try {
        await result.current.adjustScore("m1", "home", 1);
      } catch {
        // ignore
      }
    });

    expect(enqueueAction).toHaveBeenCalledWith(peladaId, "ADJUST_SCORE", expect.objectContaining({ matchId: "m1" }));
  });

  it("should handle startPeladaTimer", async () => {
    const { result } = renderHook(() => useMatchActions(peladaId, mockDelegates));

    await act(async () => {
      await result.current.startPeladaTimer();
    });

    expect(mockApi.startPeladaTimer).toHaveBeenCalledWith(peladaId);
  });
});
