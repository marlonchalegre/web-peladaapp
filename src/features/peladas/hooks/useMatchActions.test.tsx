/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMatchActions, type MatchStateDelegates } from "./useMatchActions";

const { mockApi, mockEnqueueAction } = vi.hoisted(() => ({
  mockApi: {
    updateMatchScore: vi.fn(),
    createMatchEvent: vi.fn(),
    deleteMatchEvent: vi.fn(),
    addMatchLineupPlayer: vi.fn(),
    replaceMatchLineupPlayer: vi.fn(),
    removePlayerFromTeam: vi.fn(),
    closePelada: vi.fn(),
    endMatch: vi.fn(),
    startPeladaTimer: vi.fn(),
    pausePeladaTimer: vi.fn(),
    resetPeladaTimer: vi.fn(),
    startMatchTimer: vi.fn(),
    pauseMatchTimer: vi.fn(),
    resetMatchTimer: vi.fn(),
  },
  mockEnqueueAction: vi.fn(),
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
  enqueueAction: mockEnqueueAction,
}));

describe("useMatchActions", () => {
  const peladaId = "p1";
  let mockDelegates: MatchStateDelegates;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
      writable: true,
    });

    mockDelegates = {
      matchesRef: {
        current: [
          {
            id: "m1",
            home_score: 0,
            away_score: 0,
            status: "scheduled",
            timer_status: "stopped",
          },
          {
            id: "m2",
            home_score: 1,
            away_score: 1,
            status: "running",
            timer_status: "running",
          },
          {
            id: "m3",
            home_score: 2,
            away_score: 2,
            status: "finished",
            timer_status: "stopped",
          },
        ] as any,
      },
      setMatches: vi.fn(),
      refreshData: vi.fn().mockResolvedValue(undefined),
      setError: vi.fn(),
      setMatchEvents: vi.fn(),
      setLineupsByMatch: vi.fn(),
      setPelada: vi.fn(),
    };

    Object.values(mockApi).forEach((m) => {
      if (typeof (m as any).mockResolvedValue === "function")
        (m as any).mockResolvedValue({});
    });
  });

  describe("adjustScore", () => {
    it("should handle score adjustment successfully", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.adjustScore("m1", "home", 1);
      });
      expect(mockApi.updateMatchScore).toHaveBeenCalledWith(
        "m1",
        1,
        0,
        "running",
      );
    });

    it("should handle score adjustments for finished matches without changing status", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.adjustScore("m3", "home", 1);
      });
      expect(mockApi.updateMatchScore).toHaveBeenCalledWith(
        "m3",
        3,
        2,
        "finished",
      );
    });

    it("should return status as scheduled if scores become zero", async () => {
      mockDelegates.matchesRef.current[0].home_score = 1;
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.adjustScore("m1", "home", -1);
      });
      expect(mockApi.updateMatchScore).toHaveBeenCalledWith(
        "m1",
        0,
        0,
        "scheduled",
      );
    });

    it("should throw NEGATIVE_SCORE if adjustment makes score negative", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await expect(
        act(async () => {
          await result.current.adjustScore("m1", "home", -1);
        }),
      ).rejects.toThrow("NEGATIVE_SCORE");
      expect(mockDelegates.setError).toHaveBeenCalledWith(
        "peladas.matches.error.negative_score",
      );
    });

    it("should return early if match is not found", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.adjustScore("invalid-id", "home", 1);
      });
      expect(mockApi.updateMatchScore).not.toHaveBeenCalled();
    });

    it("should queue action if offline", async () => {
      Object.defineProperty(navigator, "onLine", { value: false });
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.adjustScore("m1", "home", 1);
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(peladaId, "ADJUST_SCORE", {
        matchId: "m1",
        newHome: 1,
        newAway: 0,
        status: "running",
      });
    });

    it("should handle API failure gracefully", async () => {
      mockApi.updateMatchScore.mockRejectedValue(new Error("API error"));
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await expect(
        act(async () => {
          await result.current.adjustScore("m1", "home", 1);
        }),
      ).rejects.toThrow("API error");
      expect(mockDelegates.setError).toHaveBeenCalledWith("API error");
    });
  });

  describe("events handling", () => {
    it("should record match event successfully", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.recordEvent("m1", "pl1", "goal", 100, 200);
      });
      expect(mockApi.createMatchEvent).toHaveBeenCalledWith(
        "m1",
        "pl1",
        "goal",
        100,
        200,
        undefined,
      );
      expect(mockDelegates.refreshData).toHaveBeenCalled();
    });

    it("should queue recordEvent if offline", async () => {
      Object.defineProperty(navigator, "onLine", { value: false });
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.recordEvent("m1", "pl1", "goal", 100, 200);
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(peladaId, "RECORD_EVENT", {
        matchId: "m1",
        playerId: "pl1",
        type: "goal",
        sessionTimeMs: 100,
        matchTimeMs: 200,
      });
    });

    it("should delete match event successfully", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.deleteEventAndRefresh("m1", "pl1", "goal");
      });
      expect(mockApi.deleteMatchEvent).toHaveBeenCalledWith(
        "m1",
        "pl1",
        "goal",
        undefined,
      );
      expect(mockDelegates.refreshData).toHaveBeenCalled();
    });

    it("should optimistically delete goal and its associated assist via parent_event_id", async () => {
      let updatedEvents: any[] = [];
      mockDelegates.setMatchEvents = vi.fn((updater) => {
        const prevEvents = [
          {
            id: "goal-1",
            match_id: "m1",
            player_id: "pl1",
            event_type: "goal",
            session_time_ms: 100,
            match_time_ms: 200,
          },
          {
            id: "assist-1",
            match_id: "m1",
            player_id: "pl2",
            event_type: "assist",
            session_time_ms: 100,
            match_time_ms: 200,
            parent_event_id: "goal-1",
          },
          {
            id: "goal-2",
            match_id: "m1",
            player_id: "pl3",
            event_type: "goal",
            session_time_ms: 300,
            match_time_ms: 400,
          },
        ];
        updatedEvents = updater(prevEvents);
      });

      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );

      await act(async () => {
        await result.current.deleteEventAndRefresh(
          "m1",
          "pl1",
          "goal",
          "goal-1",
        );
      });

      expect(updatedEvents).toEqual([
        {
          id: "goal-2",
          match_id: "m1",
          player_id: "pl3",
          event_type: "goal",
          session_time_ms: 300,
          match_time_ms: 400,
        },
      ]);
    });

    it("should optimistically delete last goal and its associated assist via parent_event_id when no eventId is provided", async () => {
      let updatedEvents: any[] = [];
      mockDelegates.setMatchEvents = vi.fn((updater) => {
        const prevEvents = [
          {
            id: "goal-1",
            match_id: "m1",
            player_id: "pl1",
            event_type: "goal",
            session_time_ms: 100,
            match_time_ms: 200,
          },
          {
            id: "assist-1",
            match_id: "m1",
            player_id: "pl2",
            event_type: "assist",
            session_time_ms: 100,
            match_time_ms: 200,
            parent_event_id: "goal-1",
          },
        ];
        updatedEvents = updater(prevEvents);
      });

      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );

      await act(async () => {
        await result.current.deleteEventAndRefresh("m1", "pl1", "goal");
      });

      expect(updatedEvents).toEqual([]);
    });

    it("should optimistically delete goal and its associated assist via matching session/match times as fallback", async () => {
      let updatedEvents: any[] = [];
      mockDelegates.setMatchEvents = vi.fn((updater) => {
        const prevEvents = [
          {
            id: "goal-1",
            match_id: "m1",
            player_id: "pl1",
            event_type: "goal",
            session_time_ms: 100,
            match_time_ms: 200,
          },
          {
            id: "assist-1",
            match_id: "m1",
            player_id: "pl2",
            event_type: "assist",
            session_time_ms: 100,
            match_time_ms: 200,
          },
        ];
        updatedEvents = updater(prevEvents);
      });

      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );

      await act(async () => {
        await result.current.deleteEventAndRefresh(
          "m1",
          "pl1",
          "goal",
          "goal-1",
        );
      });

      expect(updatedEvents).toEqual([]);
    });

    it("should queue deleteEvent if offline", async () => {
      Object.defineProperty(navigator, "onLine", { value: false });
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.deleteEventAndRefresh("m1", "pl1", "goal");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(peladaId, "DELETE_EVENT", {
        matchId: "m1",
        playerId: "pl1",
        type: "goal",
      });
    });
  });

  describe("team player actions", () => {
    it("should add player to team successfully", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.addPlayerToTeam("m1", "t1", "pl1");
      });
      expect(mockApi.addMatchLineupPlayer).toHaveBeenCalledWith(
        "m1",
        "t1",
        "pl1",
      );
    });

    it("should queue addPlayerToTeam if offline", async () => {
      Object.defineProperty(navigator, "onLine", { value: false });
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.addPlayerToTeam("m1", "t1", "pl1");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "ADD_PLAYER_TO_TEAM",
        {
          matchId: "m1",
          teamId: "t1",
          playerId: "pl1",
        },
      );
    });

    it("should replace player on team successfully", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.replacePlayerOnMatchTeam(
          "m1",
          "t1",
          "p_out",
          "p_in",
        );
      });
      expect(mockApi.replaceMatchLineupPlayer).toHaveBeenCalledWith(
        "m1",
        "t1",
        "p_out",
        "p_in",
      );
    });

    it("should queue replacePlayerOnMatchTeam if offline", async () => {
      Object.defineProperty(navigator, "onLine", { value: false });
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.replacePlayerOnMatchTeam(
          "m1",
          "t1",
          "p_out",
          "p_in",
        );
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "REPLACE_PLAYER",
        {
          matchId: "m1",
          teamId: "t1",
          outPlayerId: "p_out",
          inPlayerId: "p_in",
        },
      );
    });
  });

  describe("executeEndMatch and executeClosePelada", () => {
    it("should end match successfully and pause timer if running", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.executeEndMatch("m2");
      });
      expect(mockApi.pauseMatchTimer).toHaveBeenCalledWith("m2");
      expect(mockApi.updateMatchScore).toHaveBeenCalledWith(
        "m2",
        1,
        1,
        "finished",
      );
    });

    it("should not pause timer if timer is stopped", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.executeEndMatch("m1");
      });
      expect(mockApi.pauseMatchTimer).not.toHaveBeenCalled();
      expect(mockApi.updateMatchScore).toHaveBeenCalledWith(
        "m1",
        0,
        0,
        "finished",
      );
    });

    it("should return early in executeEndMatch if match is not found", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.executeEndMatch("invalid-id");
      });
      expect(mockApi.updateMatchScore).not.toHaveBeenCalled();
    });

    it("should close pelada successfully", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.executeClosePelada();
      });
      expect(mockApi.closePelada).toHaveBeenCalledWith(peladaId);
    });
  });

  describe("timers", () => {
    it("should handle pelada timers successfully", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.startPeladaTimer();
      });
      expect(mockApi.startPeladaTimer).toHaveBeenCalledWith(peladaId);

      await act(async () => {
        await result.current.pausePeladaTimer();
      });
      expect(mockApi.pausePeladaTimer).toHaveBeenCalledWith(peladaId);

      await act(async () => {
        await result.current.resetPeladaTimer();
      });
      expect(mockApi.resetPeladaTimer).toHaveBeenCalledWith(peladaId);
    });

    it("should handle match timers successfully", async () => {
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.startMatchTimer("m1");
      });
      expect(mockApi.startMatchTimer).toHaveBeenCalledWith("m1");

      await act(async () => {
        await result.current.pauseMatchTimer("m1");
      });
      expect(mockApi.pauseMatchTimer).toHaveBeenCalledWith("m1");

      await act(async () => {
        await result.current.resetMatchTimer("m1");
      });
      expect(mockApi.resetMatchTimer).toHaveBeenCalledWith("m1");
    });

    it("should handle offline and network error conditions for all timers and actions", async () => {
      // Offline mode
      Object.defineProperty(navigator, "onLine", { value: false });
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );

      // 1. Pelada Timers offline
      await act(async () => {
        await result.current.startPeladaTimer();
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "START_PELADA_TIMER",
        { peladaId },
      );

      await act(async () => {
        await result.current.pausePeladaTimer();
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "PAUSE_PELADA_TIMER",
        { peladaId },
      );

      await act(async () => {
        await result.current.resetPeladaTimer();
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "RESET_PELADA_TIMER",
        { peladaId },
      );

      // 2. Match Timers offline
      await act(async () => {
        await result.current.startMatchTimer("m1");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "START_MATCH_TIMER",
        { matchId: "m1" },
      );

      await act(async () => {
        await result.current.pauseMatchTimer("m1");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "PAUSE_MATCH_TIMER",
        { matchId: "m1" },
      );

      await act(async () => {
        await result.current.resetMatchTimer("m1");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "RESET_MATCH_TIMER",
        { matchId: "m1" },
      );

      // 3. executeClosePelada offline
      await act(async () => {
        await result.current.executeClosePelada();
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(peladaId, "CLOSE_PELADA", {
        peladaId,
      });

      // 4. executeEndMatch offline
      await act(async () => {
        await result.current.executeEndMatch("m1");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(peladaId, "END_MATCH", {
        matchId: "m1",
        homeScore: 0,
        awayScore: 0,
      });

      // Online network errors
      Object.defineProperty(navigator, "onLine", { value: true });

      // 5. Test handleNetworkError returning true (e.g. "Failed to fetch")
      mockApi.startPeladaTimer.mockRejectedValue(new Error("Failed to fetch"));
      await act(async () => {
        await result.current.startPeladaTimer();
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "START_PELADA_TIMER",
        { peladaId },
      );

      mockApi.pausePeladaTimer.mockRejectedValue(new Error("Network Error"));
      await act(async () => {
        await result.current.pausePeladaTimer();
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "PAUSE_PELADA_TIMER",
        { peladaId },
      );

      mockApi.resetPeladaTimer.mockRejectedValue(new Error("Network timeout"));
      await act(async () => {
        await result.current.resetPeladaTimer();
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "RESET_PELADA_TIMER",
        { peladaId },
      );

      mockApi.startMatchTimer.mockRejectedValue(new Error("Failed to fetch"));
      await act(async () => {
        await result.current.startMatchTimer("m1");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "START_MATCH_TIMER",
        { matchId: "m1" },
      );

      mockApi.pauseMatchTimer.mockRejectedValue(new Error("Network Error"));
      await act(async () => {
        await result.current.pauseMatchTimer("m1");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "PAUSE_MATCH_TIMER",
        { matchId: "m1" },
      );

      mockApi.resetMatchTimer.mockRejectedValue(new Error("Network timeout"));
      await act(async () => {
        await result.current.resetMatchTimer("m1");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "RESET_MATCH_TIMER",
        { matchId: "m1" },
      );

      // 6. Test handleNetworkError returning false (standard error)
      // non-Error reject
      mockApi.startPeladaTimer.mockRejectedValue("String Timer Error");
      await act(async () => {
        await result.current.startPeladaTimer();
      });
      // Should not throw or crash, just not queue (handled silently or logged inside component if not caught)

      // Other actions standard errors (non-Error and Error instances)
      mockApi.addMatchLineupPlayer.mockRejectedValue(
        new Error("Standard Error"),
      );
      await act(async () => {
        await result.current.addPlayerToTeam("m1", "t1", "pl1");
      });
      expect(mockDelegates.setError).toHaveBeenCalledWith("Standard Error");

      mockApi.replaceMatchLineupPlayer.mockRejectedValue(
        "String Replace Error",
      );
      await act(async () => {
        await result.current.replacePlayerOnMatchTeam(
          "m1",
          "t1",
          "p_out",
          "p_in",
        );
      });
      expect(mockDelegates.setError).toHaveBeenCalledWith(
        "peladas.matches.error.replace_player_failed",
      );

      mockApi.closePelada.mockRejectedValue("String Close Error");
      await act(async () => {
        await result.current.executeClosePelada();
      });
      expect(mockDelegates.setError).toHaveBeenCalledWith(
        "peladas.matches.error.close_failed",
      );

      mockApi.updateMatchScore.mockRejectedValue(new Error("End Match Error"));
      await act(async () => {
        await result.current.executeEndMatch("m1");
      });
      expect(mockDelegates.setError).toHaveBeenCalledWith("End Match Error");
    });
  });

  describe("network errors and edge cases for all actions", () => {
    it("should queue adjustScore when online but updateMatchScore fails with a network error", async () => {
      mockApi.updateMatchScore.mockRejectedValueOnce(
        new Error("Failed to fetch"),
      );
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.adjustScore("m1", "home", 1);
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(peladaId, "ADJUST_SCORE", {
        matchId: "m1",
        newHome: 1,
        newAway: 0,
        status: "running",
      });
    });

    it("should queue deleteEventAndRefresh when online but deleteMatchEvent fails with a network error", async () => {
      mockApi.deleteMatchEvent.mockRejectedValueOnce(
        new Error("Network Error"),
      );
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.deleteEventAndRefresh("m1", "pl1", "goal");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(peladaId, "DELETE_EVENT", {
        matchId: "m1",
        playerId: "pl1",
        type: "goal",
      });
    });

    it("should queue recordEvent when online but createMatchEvent fails with a network error", async () => {
      mockApi.createMatchEvent.mockRejectedValueOnce(
        new Error("Network timeout"),
      );
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.recordEvent("m1", "pl1", "goal", 100, 200);
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(peladaId, "RECORD_EVENT", {
        matchId: "m1",
        playerId: "pl1",
        type: "goal",
        sessionTimeMs: 100,
        matchTimeMs: 200,
      });
    });

    it("should queue addPlayerToTeam when online but addMatchLineupPlayer fails with a network error", async () => {
      mockApi.addMatchLineupPlayer.mockRejectedValueOnce(
        new Error("Failed to fetch"),
      );
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.addPlayerToTeam("m1", "t1", "pl1");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "ADD_PLAYER_TO_TEAM",
        {
          matchId: "m1",
          teamId: "t1",
          playerId: "pl1",
        },
      );
    });

    it("should queue replacePlayerOnMatchTeam when online but replaceMatchLineupPlayer fails with a network error", async () => {
      mockApi.replaceMatchLineupPlayer.mockRejectedValueOnce(
        new Error("Network Error"),
      );
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.replacePlayerOnMatchTeam(
          "m1",
          "t1",
          "p_out",
          "p_in",
        );
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(
        peladaId,
        "REPLACE_PLAYER",
        {
          matchId: "m1",
          teamId: "t1",
          outPlayerId: "p_out",
          inPlayerId: "p_in",
        },
      );
    });

    it("should queue executeClosePelada when online but closePelada fails with a network error", async () => {
      mockApi.closePelada.mockRejectedValueOnce(new Error("Network timeout"));
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.executeClosePelada();
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(peladaId, "CLOSE_PELADA", {
        peladaId,
      });
    });

    it("should queue executeEndMatch when online but updateMatchScore fails with a network error", async () => {
      mockApi.updateMatchScore.mockRejectedValueOnce(
        new Error("Failed to fetch"),
      );
      const { result } = renderHook(() =>
        useMatchActions(peladaId, mockDelegates),
      );
      await act(async () => {
        await result.current.executeEndMatch("m1");
      });
      expect(mockEnqueueAction).toHaveBeenCalledWith(peladaId, "END_MATCH", {
        matchId: "m1",
        homeScore: 0,
        awayScore: 0,
      });
    });

    it("should return early in executeClosePelada if peladaId is falsy", async () => {
      const { result } = renderHook(() => useMatchActions("", mockDelegates));
      await act(async () => {
        await result.current.executeClosePelada();
      });
      expect(mockApi.closePelada).not.toHaveBeenCalled();
    });
  });
});
