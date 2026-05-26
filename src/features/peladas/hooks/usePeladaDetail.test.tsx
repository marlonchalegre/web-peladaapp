/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePeladaDetail } from "./usePeladaDetail";
import { MemoryRouter } from "react-router-dom";

// Stable mocks
const stableT = (key: string) => key;
const stableTranslation = {
  t: stableT,
  i18n: { language: "en", changeLanguage: vi.fn() },
};
vi.mock("react-i18next", () => ({
  useTranslation: () => stableTranslation,
}));

const stableUser = { id: "u1", name: "User 1", admin_orgs: ["org1"] };
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: () => ({
    user: stableUser,
    isLoggedIn: true,
  }),
}));

const { mockApiClient, mockApi } = vi.hoisted(() => ({
  mockApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  mockApi: {
    getPeladaFullDetails: vi.fn(),
    beginPelada: vi.fn(),
    closePelada: vi.fn(),
    deletePelada: vi.fn(),
    createTeam: vi.fn(),
    deleteTeam: vi.fn(),
    addMatchLineupPlayer: vi.fn(),
    addPlayerToTeam: vi.fn(),
    removePlayerFromTeam: vi.fn(),
    updateVotingEnabled: vi.fn(),
    getInviteLink: vi.fn(),
    updatePelada: vi.fn(),
    randomizeTeams: vi.fn(),
    addPlayersToPeladaFromOrg: vi.fn(),
    markTransactionPaid: vi.fn(),
    reverseTransactionPayment: vi.fn(),
    batchUpdateAttendance: vi.fn(),
    addTransaction: vi.fn(),
    reverseTransaction: vi.fn(),
  },
}));

vi.mock("../../../shared/api/client", () => ({
  api: mockApiClient,
}));

vi.mock("../../../shared/api/endpoints", () => ({
  createApi: vi.fn(() => mockApi),
}));

describe("usePeladaDetail", () => {
  const peladaId = "p1";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.confirm = vi.fn().mockReturnValue(true);

    // Default resolve for all mockApi methods
    Object.values(mockApi).forEach((m) => {
      if (typeof (m as any).mockResolvedValue === "function")
        (m as any).mockResolvedValue({});
    });
    // Default resolve for apiClient
    Object.values(mockApiClient).forEach((m) =>
      (m as any).mockResolvedValue({}),
    );

    mockApi.getPeladaFullDetails.mockResolvedValue({
      pelada: { id: peladaId, status: "open", organization_id: "org1" },
      teams: [],
      available_players: [],
      voting_info: null,
      pelada_transactions: [],
      scores: {},
    });
  });

  it("should initialize and fetch data", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    expect(result.current.pelada?.id).toBe(peladaId);
  });

  it("should handle handleBeginPelada successfully", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    await act(async () => {
      await result.current.handleBeginPelada();
    });
    expect(mockApi.beginPelada).toHaveBeenCalled();
  });

  it("should handle handleRandomizeTeams successfully", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    await act(async () => {
      await result.current.handleRandomizeTeams();
    });
    expect(mockApiClient.post).toHaveBeenCalledWith(
      expect.stringContaining("randomize"),
      expect.anything(),
    );
  });

  it("should handle handleUpdatePlayersPerTeam successfully", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    await act(async () => {
      await result.current.handleUpdatePlayersPerTeam(5);
    });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({ players_per_team: 5 }),
    );
  });

  it("should handle handleAddPlayersFromOrg successfully", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    await act(async () => {
      await result.current.handleAddPlayersFromOrg(["pl1"]);
    });
    expect(mockApi.batchUpdateAttendance).toHaveBeenCalledWith(
      peladaId,
      ["pl1"],
      "confirmed",
    );
  });

  it("should handle handleMarkPaid successfully", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    await act(async () => {
      await result.current.handleMarkPaid("pl1", 20);
    });
    expect(mockApi.addTransaction).toHaveBeenCalledWith(
      "org1",
      expect.objectContaining({ player_id: "pl1", amount: 20 }),
    );
  });

  it("should handle handleReversePayment successfully", async () => {
    mockApi.getPeladaFullDetails.mockResolvedValue({
      pelada: { id: peladaId, status: "open", organization_id: "org1" },
      pelada_transactions: [
        {
          id: "tx1",
          player_id: "pl1",
          type: "income",
          category: "diarista_fee",
          status: "paid",
        },
      ],
      teams: [],
      available_players: [],
      voting_info: null,
      scores: {},
    });
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    await act(async () => {
      await result.current.handleReversePayment("pl1");
    });
    expect(mockApi.reverseTransaction).toHaveBeenCalledWith("org1", "tx1");
  });

  it("should handle dropToFixedGk successfully", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi
          .fn()
          .mockReturnValue(
            JSON.stringify({ playerId: "pl1", sourceTeamId: null }),
          ),
      },
    } as any;
    await act(async () => {
      await result.current.dropToFixedGk(mockEvent, "home");
    });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({ home_fixed_goalkeeper_id: "pl1" }),
    );
  });

  it("should handle removeFixedGk successfully", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    await act(async () => {
      await result.current.removeFixedGk("home");
    });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({ home_fixed_goalkeeper_id: null }),
    );
  });

  it("should set error if handleRandomizeTeams fails", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    mockApiClient.post.mockRejectedValueOnce(new Error("Randomize Error"));
    await act(async () => {
      await result.current.handleRandomizeTeams();
    });
    expect(result.current.error).toBe("Randomize Error");
  });

  it("should set error if handleReversePayment fails", async () => {
    mockApi.getPeladaFullDetails.mockResolvedValue({
      pelada: { id: peladaId, status: "open", organization_id: "org1" },
      pelada_transactions: [
        {
          id: "tx1",
          player_id: "pl1",
          type: "income",
          category: "diarista_fee",
          status: "paid",
        },
      ],
      teams: [],
      available_players: [],
      voting_info: null,
      scores: {},
    });
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    mockApi.reverseTransaction.mockRejectedValueOnce(new Error("Reversal Error"));
    await act(async () => {
      await result.current.handleReversePayment("pl1");
    });
    expect(result.current.error).toBe("Reversal Error");
  });

  it("should execute handlePerformSwap when incoming player comes from another team", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    await act(async () => {
      await result.current.handlePerformSwap("incomingPlayer", "targetTeam", "sourceTeam", "playerToReplace");
    });
    expect(mockApi.removePlayerFromTeam).toHaveBeenCalledWith("targetTeam", "playerToReplace");
    expect(mockApi.removePlayerFromTeam).toHaveBeenCalledWith("sourceTeam", "incomingPlayer");
    expect(mockApi.addPlayerToTeam).toHaveBeenCalledWith("targetTeam", "incomingPlayer", false);
    expect(mockApi.addPlayerToTeam).toHaveBeenCalledWith("sourceTeam", "playerToReplace", false);
  });

  it("should execute handlePerformSwap when incoming player is fixed goalkeeper on bench", async () => {
    mockApi.getPeladaFullDetails.mockResolvedValue({
      pelada: {
        id: peladaId,
        status: "open",
        organization_id: "org1",
        home_fixed_goalkeeper_id: "incomingPlayer",
        away_fixed_goalkeeper_id: "incomingPlayerAway",
      },
      teams: [],
      available_players: [],
      voting_info: null,
      scores: {},
    });
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null), {
      timeout: 2000,
    });
    await act(async () => {
      await result.current.handlePerformSwap("incomingPlayer", "targetTeam", null, "playerToReplace");
    });
    expect(mockApi.removePlayerFromTeam).toHaveBeenCalledWith("targetTeam", "playerToReplace");
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({ home_fixed_goalkeeper_id: null }),
    );
    expect(mockApi.addPlayerToTeam).toHaveBeenCalledWith("targetTeam", "incomingPlayer", false);

    // Swap away fixed GK
    await act(async () => {
      await result.current.handlePerformSwap("incomingPlayerAway", "targetTeam", null, "playerToReplace");
    });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({ away_fixed_goalkeeper_id: null }),
    );

    // Swap fail path with non-Error
    mockApi.removePlayerFromTeam.mockRejectedValueOnce("String Swap Error");
    await act(async () => {
      await result.current.handlePerformSwap("incomingPlayer", "targetTeam", null, "playerToReplace");
    });
    expect(result.current.error).toBe("Swap failed");
  });

  it("should cover dropToBench branches: processing, parseDrag error, and GK unsetting", async () => {
    mockApi.getPeladaFullDetails.mockResolvedValue({
      pelada: {
        id: peladaId,
        status: "open",
        organization_id: "org1",
        home_fixed_goalkeeper_id: "gkHome",
        away_fixed_goalkeeper_id: "gkAway",
      },
      teams: [],
      available_players: [],
      voting_info: null,
      scores: {},
    });

    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null));

    // 1. parseDrag returns null (getData throws)
    const malformedEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockImplementation(() => {
          throw new Error("fail");
        }),
      },
    } as any;
    await act(async () => {
      await result.current.dropToBench(malformedEvent);
    });
    expect(mockApiClient.put).not.toHaveBeenCalled();

    // 2. dropToBench for home GK
    const homeGkEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue(JSON.stringify({ playerId: "gkHome", sourceTeamId: null })),
      },
    } as any;
    await act(async () => {
      await result.current.dropToBench(homeGkEvent);
    });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({ home_fixed_goalkeeper_id: null }),
    );

    // 3. dropToBench for away GK
    const awayGkEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue(JSON.stringify({ playerId: "gkAway", sourceTeamId: null })),
      },
    } as any;
    await act(async () => {
      await result.current.dropToBench(awayGkEvent);
    });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({ away_fixed_goalkeeper_id: null }),
    );

    // 4. dropToBench error path with non-Error
    mockApiClient.put.mockRejectedValueOnce("String Bench Error");
    await act(async () => {
      await result.current.dropToBench(homeGkEvent);
    });
    expect(result.current.error).toBe("peladas.detail.error.move_to_bench_failed");
  });

  it("should cover dropToTeam branches: same team, unsetting global GKs, and errors", async () => {
    mockApi.getPeladaFullDetails.mockResolvedValue({
      pelada: {
        id: peladaId,
        status: "open",
        organization_id: "org1",
        home_fixed_goalkeeper_id: "gkHome",
        away_fixed_goalkeeper_id: "gkAway",
      },
      teams: [],
      available_players: [],
      voting_info: null,
      scores: {},
    });

    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null));

    // Same team guard
    const sameTeamEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue(JSON.stringify({ playerId: "pl1", sourceTeamId: "team1" })),
      },
    } as any;
    await act(async () => {
      await result.current.dropToTeam(sameTeamEvent, "team1");
    });
    expect(mockApi.addPlayerToTeam).not.toHaveBeenCalled();

    // Move home GK to team2
    const homeGkEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue(JSON.stringify({ playerId: "gkHome", sourceTeamId: null })),
      },
    } as any;
    await act(async () => {
      await result.current.dropToTeam(homeGkEvent, "team2");
    });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({ home_fixed_goalkeeper_id: null }),
    );
    expect(mockApi.addPlayerToTeam).toHaveBeenCalledWith("team2", "gkHome", false);

    // Move away GK to team2
    const awayGkEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue(JSON.stringify({ playerId: "gkAway", sourceTeamId: null })),
      },
    } as any;
    await act(async () => {
      await result.current.dropToTeam(awayGkEvent, "team2");
    });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({ away_fixed_goalkeeper_id: null }),
    );

    // non-Error reject in dropToTeam
    mockApi.addPlayerToTeam.mockRejectedValueOnce("String Team Drop Error");
    await act(async () => {
      await result.current.dropToTeam(homeGkEvent, "team2");
    });
    expect(result.current.error).toBe("peladas.detail.error.move_player_failed");
  });

  it("should cover dropToFixedGk and removeFixedGk branches and errors", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null));

    // dropToFixedGk away side
    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue(JSON.stringify({ playerId: "pl1", sourceTeamId: "team1" })),
      },
    } as any;
    await act(async () => {
      await result.current.dropToFixedGk(mockEvent, "away");
    });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({ away_fixed_goalkeeper_id: "pl1" }),
    );

    // dropToFixedGk error
    mockApiClient.put.mockRejectedValueOnce("String GK Error");
    await act(async () => {
      await result.current.dropToFixedGk(mockEvent, "home");
    });
    expect(result.current.error).toBe("peladas.detail.error.set_goalkeeper_failed");

    // removeFixedGk away side
    await act(async () => {
      await result.current.removeFixedGk("away");
    });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({ away_fixed_goalkeeper_id: null }),
    );

    // removeFixedGk error
    mockApiClient.put.mockRejectedValueOnce("String Remove GK Error");
    await act(async () => {
      await result.current.removeFixedGk("home");
    });
    expect(result.current.error).toBe("peladas.detail.error.remove_player_failed");
  });

  it("should cover handleSetGoalkeeper, handleRemovePlayer, and handleUpdatePlayersPerTeam error branches", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null));

    // handleSetGoalkeeper error
    mockApi.addPlayerToTeam.mockRejectedValueOnce("GK Set Error");
    await act(async () => {
      await result.current.handleSetGoalkeeper("team1", "pl1");
    });
    expect(result.current.error).toBe("peladas.detail.error.set_goalkeeper_failed");

    // handleRemovePlayer error
    mockApi.removePlayerFromTeam.mockRejectedValueOnce("Remove Error");
    await act(async () => {
      await result.current.handleRemovePlayer("team1", "pl1");
    });
    expect(result.current.error).toBe("peladas.detail.error.remove_player_failed");

    // handleUpdatePlayersPerTeam error
    mockApiClient.put.mockRejectedValueOnce("Count Update Error");
    await act(async () => {
      await result.current.handleUpdatePlayersPerTeam(6);
    });
    expect(result.current.error).toBe("peladas.detail.error.update_failed");
  });

  it("should cover handleBeginPelada, handleCreateTeam, and handleDeleteTeam branches and errors", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null));

    // handleBeginPelada with NaN matchesPerTeam
    act(() => {
      result.current.setMatchesPerTeam("not-a-number");
    });
    await act(async () => {
      await result.current.handleBeginPelada();
    });
    expect(mockApi.beginPelada).toHaveBeenCalledWith(peladaId, 0);

    // handleBeginPelada error
    mockApi.beginPelada.mockRejectedValueOnce("Start Error");
    await act(async () => {
      await result.current.handleBeginPelada();
    });
    expect(result.current.error).toBe("peladas.detail.error.start_failed");

    // handleCreateTeam error
    mockApi.createTeam.mockRejectedValueOnce("Create Team Error");
    await act(async () => {
      await result.current.handleCreateTeam("Team New");
    });
    expect(result.current.error).toBe("peladas.detail.error.create_team_failed");

    // handleDeleteTeam error
    mockApi.deleteTeam.mockRejectedValueOnce("Delete Team Error");
    await act(async () => {
      await result.current.handleDeleteTeam("team1");
    });
    expect(result.current.error).toBe("peladas.detail.error.delete_team_failed");
  });

  it("should cover handleToggleFixedGoalkeepers, handleAddPlayersFromOrg, and payment guards/failures", async () => {
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).not.toBe(null));

    // handleToggleFixedGoalkeepers with disabled
    await act(async () => {
      await result.current.handleToggleFixedGoalkeepers(false);
    });
    expect(mockApiClient.put).toHaveBeenCalledWith(
      expect.stringContaining(peladaId),
      expect.objectContaining({
        fixed_goalkeepers: false,
        home_fixed_goalkeeper_id: null,
        away_fixed_goalkeeper_id: null,
      }),
    );

    // handleToggleFixedGoalkeepers error
    mockApiClient.put.mockRejectedValueOnce("Toggle Error");
    await act(async () => {
      await result.current.handleToggleFixedGoalkeepers(true);
    });
    expect(result.current.error).toBe("peladas.detail.error.update_failed");

    // handleAddPlayersFromOrg error
    mockApi.batchUpdateAttendance.mockRejectedValueOnce("Batch Error");
    await act(async () => {
      await result.current.handleAddPlayersFromOrg(["pl1"]);
    });
    expect(result.current.error).toBe("peladas.detail.error.update_failed");

    // handleMarkPaid error with non-Error
    mockApi.addTransaction.mockRejectedValueOnce("Payment Error");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      await result.current.handleMarkPaid("pl1", 10);
    });
    expect(result.current.error).toBe("organizations.management.finance.transactions.error.add_failed");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();

  });

  it("should guard handleMarkPaid and handleReversePayment when pelada is null", async () => {
    mockApi.getPeladaFullDetails.mockResolvedValue({
      pelada: null,
      teams: [],
      available_players: [],
      voting_info: null,
      scores: {},
    });
    const { result } = renderHook(() => usePeladaDetail(peladaId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.pelada).toBeNull());

    await act(async () => {
      await result.current.handleMarkPaid("pl1", 20);
    });
    expect(mockApi.addTransaction).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleReversePayment("pl1");
    });
    expect(mockApi.reverseTransaction).not.toHaveBeenCalled();
  });
});


