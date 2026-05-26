import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePeladaData } from "./usePeladaData";
import { api } from "../../../shared/api/client";

// Mocks
const mockNavigate = vi.fn();
let mockPathname = "/peladas/test-pelada-id";

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

const stableTranslation = {
  t: (key: string) => key,
  i18n: { language: "en", changeLanguage: vi.fn() },
};
vi.mock("react-i18next", () => ({
  useTranslation: () => stableTranslation,
}));

vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("usePeladaData", () => {
  const peladaId = "test-pelada-id";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockPathname = `/peladas/${peladaId}`;
  });

  const mockData = {
    pelada: { id: peladaId, status: "running", organization_id: "org-1" },
    matches: [{ id: "m1", home_score: 0, away_score: 0 }],
    teams: [{ id: "t1", name: "Team 1" }],
    team_players_map: {
      t1: [{ team_id: "t1", player_id: "pl1", is_goalkeeper: false }],
    },
    match_lineups_map: {
      m1: { t1: [{ team_id: "t1", player_id: "pl1", is_goalkeeper: false }] },
    },
    organization_players: [{ id: "pl1", user_id: "u1" }],
    users: [{ id: "u1", name: "User One" }],
    match_events: [
      { id: "e1", match_id: "m1", player_id: "pl1", event_type: "goal" },
    ],
    player_stats: [{ player_id: "pl1", goals: 1 }],
    attendance: [{ player_id: "pl1", status: "confirmed" }],
    pelada_transactions: [{ id: "tx1", amount: 20 }],
  };

  it("should initialize and fetch data successfully", async () => {
    vi.mocked(api.get).mockResolvedValue(mockData);
    const { result } = renderHook(() => usePeladaData(peladaId));

    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 2000,
    });

    expect(result.current.pelada?.id).toBe(peladaId);
    expect(result.current.matches).toHaveLength(1);
    expect(result.current.teams).toHaveLength(1);
    expect(result.current.userIdToName).toEqual({ u1: "User One" });
    expect(result.current.orgPlayerIdToUserId).toEqual({ pl1: "u1" });
    expect(result.current.orgPlayerIdToPlayer).toEqual({
      pl1: { id: "pl1", user_id: "u1" },
    });
    expect(result.current.teamPlayers).toEqual({
      t1: [{ team_id: "t1", player_id: "pl1", is_goalkeeper: false }],
    });
    expect(result.current.lineupsByMatch).toEqual({
      m1: { t1: [{ team_id: "t1", player_id: "pl1", is_goalkeeper: false }] },
    });
    expect(result.current.matchEvents).toHaveLength(1);
    expect(result.current.playerStatsFromApi).toHaveLength(1);
    expect(result.current.attendance).toHaveLength(1);
    expect(result.current.peladaTransactions).toHaveLength(1);
  });

  it("should redirect if status is attendance", async () => {
    const attendanceData = {
      ...mockData,
      pelada: { ...mockData.pelada, status: "attendance" },
    };
    vi.mocked(api.get).mockResolvedValue(attendanceData);
    renderHook(() => usePeladaData(peladaId));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        `/peladas/${peladaId}/attendance`,
      );
    });
  });

  it("should redirect if status is open", async () => {
    const openData = {
      ...mockData,
      pelada: { ...mockData.pelada, status: "open" },
    };
    vi.mocked(api.get).mockResolvedValue(openData);
    renderHook(() => usePeladaData(peladaId));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/peladas/${peladaId}`);
    });
  });

  it("should redirect if status is voting and not on matches page", async () => {
    const votingData = {
      ...mockData,
      pelada: { ...mockData.pelada, status: "voting" },
    };
    vi.mocked(api.get).mockResolvedValue(votingData);
    renderHook(() => usePeladaData(peladaId));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/peladas/${peladaId}/voting`);
    });
  });

  it("should not redirect if status is voting but already on matches page", async () => {
    mockPathname = `/peladas/${peladaId}/matches`;
    const votingData = {
      ...mockData,
      pelada: { ...mockData.pelada, status: "voting" },
    };
    vi.mocked(api.get).mockResolvedValue(votingData);
    renderHook(() => usePeladaData(peladaId));

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it("should redirect if status is closed and not on matches page", async () => {
    const closedData = {
      ...mockData,
      pelada: { ...mockData.pelada, status: "closed" },
    };
    vi.mocked(api.get).mockResolvedValue(closedData);
    renderHook(() => usePeladaData(peladaId));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/peladas/${peladaId}/results`);
    });
  });

  it("should handle includeFinance option", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes("dashboard-data")) return Promise.resolve(mockData);
      if (url.includes("/finance")) return Promise.resolve({ base_price: 10 });
      return Promise.resolve({});
    });
    const { result } = renderHook(() =>
      usePeladaData(peladaId, { includeFinance: true }),
    );
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining("/finance"));
      expect(result.current.organizationFinance).toEqual({ base_price: 10 });
    });
  });

  it("should load from cache if API request fails", async () => {
    localStorage.setItem(
      `pelada_dashboard_cache_${peladaId}`,
      JSON.stringify(mockData),
    );
    vi.mocked(api.get).mockRejectedValue(new Error("API failure"));

    const { result } = renderHook(() => usePeladaData(peladaId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.pelada?.id).toBe(peladaId);
    expect(result.current.error).toBeNull();
  });

  it("should set error if API request fails and no cache exists", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => usePeladaData(peladaId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Network Error");
    expect(result.current.pelada).toBeNull();
  });

  it("should not refetch if peladaId is the same and not refresh", async () => {
    vi.mocked(api.get).mockResolvedValue(mockData);
    const { result, rerender } = renderHook(({ id }) => usePeladaData(id), {
      initialProps: { id: peladaId },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.get).toHaveBeenCalledTimes(1);

    rerender({ id: peladaId });
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("should refetch on refreshData", async () => {
    vi.mocked(api.get).mockResolvedValue(mockData);
    const { result } = renderHook(() => usePeladaData(peladaId));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refreshData();
    });
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
