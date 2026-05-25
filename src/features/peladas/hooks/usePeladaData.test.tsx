import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePeladaData } from "./usePeladaData";
import { BrowserRouter } from "react-router-dom";
import { api } from "../../../shared/api/client";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock API client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("usePeladaData", () => {
  const peladaId = "test-pelada-id";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should initialize with default states", async () => {
    // Return a promise that never resolves for the initial fetchData call
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => usePeladaData(peladaId), { wrapper });
      hookResult = result;
    });
    
    expect(hookResult.current.loading).toBe(true);
    expect(hookResult.current.error).toBe(null);
    expect(hookResult.current.pelada).toBe(null);
  });

  it("should fetch data successfully", async () => {
    const mockData = {
      pelada: { id: peladaId, status: "running", organization_id: "org-1" },
      matches: [],
      teams: [],
      team_players: {},
      lineups: {},
      org_player_id_to_user_id: {},
      user_id_to_name: {},
      players: [],
      match_events: [],
      player_stats: [],
      attendance: [],
      users: [],
      pelada_transactions: [],
    };

    vi.mocked(api.get).mockResolvedValue(mockData);

    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => usePeladaData(peladaId), { wrapper });
      hookResult = result;
    });

    await waitFor(() => {
      expect(hookResult.current.loading).toBe(false);
    }, { timeout: 2000 });

    expect(hookResult.current.pelada).toEqual(mockData.pelada);
    expect(hookResult.current.error).toBe(null);
  });

  it("should handle error during fetch", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(() => usePeladaData(peladaId), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("API Error");
  });
});
