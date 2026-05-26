/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOrganizationStatistics } from "./useOrganizationStatistics";

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    getOrganization: vi.fn(),
    listPlayersByOrg: vi.fn(),
    getOrganizationStatistics: vi.fn(),
    upsertManualStats: vi.fn(),
  },
}));

vi.mock("../../../shared/api/endpoints", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../shared/api/endpoints")>();
  return {
    ...actual,
    createApi: vi.fn(() => mockApi),
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("useOrganizationStatistics", () => {
  const orgId = "org1";

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getOrganization.mockResolvedValue({ id: orgId, name: "Org 1" });
    mockApi.listPlayersByOrg.mockResolvedValue([]);
    mockApi.getOrganizationStatistics.mockResolvedValue([]);
  });

  it("should initialize and fetch data", async () => {
    const { result } = renderHook(() => useOrganizationStatistics(orgId));

    await waitFor(() => expect(result.current.org?.name).toBe("Org 1"), {
      timeout: 2000,
    });
    await waitFor(() => expect(result.current.stats).toBeDefined());
    expect(mockApi.getOrganization).toHaveBeenCalledWith(orgId);
  });

  it("should filter stats by name", async () => {
    const mockStats = [
      {
        player_id: "p1",
        player_name: "Alice",
        goal: 10,
        peladas_played: 5,
        assist: 0,
        own_goal: 0,
      },
      {
        player_id: "p2",
        player_name: "Bob",
        goal: 5,
        peladas_played: 5,
        assist: 0,
        own_goal: 0,
      },
    ];
    mockApi.getOrganizationStatistics.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() => expect(result.current.stats).toHaveLength(2));
    await waitFor(() => expect(result.current.org).not.toBeNull());

    await act(async () => {
      result.current.setNameFilter("Ali");
    });
    expect(result.current.sortedStats).toHaveLength(1);
    expect(result.current.sortedStats[0].player_name).toBe("Alice");
  });

  it("should sort stats", async () => {
    const mockStats = [
      { player_id: "p1", player_name: "Alice", goal: 5 },
      { player_id: "p2", player_name: "Bob", goal: 10 },
    ];
    mockApi.getOrganizationStatistics.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() => expect(result.current.stats).toHaveLength(2));
    await waitFor(() => expect(result.current.org).not.toBeNull());

    // Default is goal desc
    expect(result.current.sortedStats[0].player_name).toBe("Bob");

    await act(async () => {
      result.current.handleRequestSort("goal");
    }); // toggle to asc
    expect(result.current.sortedStats[0].player_name).toBe("Alice");
  });

  it("should handle error loading organization", async () => {
    mockApi.getOrganization.mockRejectedValue(new Error("Org Load Error"));
    const { result } = renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() => expect(result.current.error).toBe("Org Load Error"));
  });

  it("should handle handleImport", async () => {
    mockApi.upsertManualStats.mockResolvedValue({});
    const { result } = renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() => expect(result.current.stats).toBeDefined());

    await act(async () => {
      await result.current.handleImport([
        { player_id: "p1", year: 2024, goals: 5 },
      ]);
    });

    expect(mockApi.upsertManualStats).toHaveBeenCalled();
    expect(
      mockApi.getOrganizationStatistics.mock.calls.length,
    ).toBeGreaterThanOrEqual(2); // Initial + after import
  });

  it("should handle error loading statistics", async () => {
    mockApi.getOrganizationStatistics.mockRejectedValue(
      new Error("Stats Load Error"),
    );
    const { result } = renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() => expect(result.current.error).toBe("Stats Load Error"));
  });

  it("should filter stats by multiple criteria", async () => {
    const mockStats = [
      {
        player_id: "p1",
        player_name: "Alice",
        goal: 10,
        peladas_played: 5,
        assist: 0,
        own_goal: 0,
      },
      {
        player_id: "p2",
        player_name: "Bob",
        goal: 5,
        peladas_played: 2,
        assist: 0,
        own_goal: 0,
      },
    ];
    mockApi.getOrganizationStatistics.mockResolvedValue(mockStats);
    const { result } = renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() => expect(result.current.stats).toHaveLength(2));
    await waitFor(() => expect(result.current.org).not.toBeNull());

    await act(async () => {
      result.current.setMinPeladas("3");
    });
    expect(result.current.sortedStats).toHaveLength(1);
    expect(result.current.sortedStats[0].player_name).toBe("Alice");
  });

  it("should handle error loading players", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockApi.listPlayersByOrg.mockRejectedValue(new Error("Players Load Error"));
    renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    consoleSpy.mockRestore();
  });

  it("should sort stats by string values", async () => {
    const mockStats = [
      { player_id: "p1", player_name: "Bob", goal: 5 },
      { player_id: "p2", player_name: "Alice", goal: 5 },
    ] as any;
    mockApi.getOrganizationStatistics.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() => expect(result.current.stats).toHaveLength(2));
    await waitFor(() => expect(result.current.org).not.toBeNull());

    // Sort by name ascending (first click is ascending)
    await act(async () => {
      result.current.handleRequestSort("player_name");
    });
    expect(result.current.sortedStats[0].player_name).toBe("Alice");

    // Sort by name descending (second click is descending)
    await act(async () => {
      result.current.handleRequestSort("player_name");
    });
    expect(result.current.sortedStats[0].player_name).toBe("Bob");
  });

  it("should handle tie-breaker when numerical values are equal", async () => {
    const mockStats = [
      { player_id: "p1", player_name: "Alice", goal: 5 },
      { player_id: "p2", player_name: "Bob", goal: 5 },
    ] as any;
    mockApi.getOrganizationStatistics.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() => expect(result.current.stats).toHaveLength(2));
    await waitFor(() => expect(result.current.org).not.toBeNull());

    await act(async () => {
      result.current.handleRequestSort("goal");
    });
    // With equal values, sort preserves original array/tie-breaker order (Alice first)
    expect(result.current.sortedStats[0].player_name).toBe("Alice");
  });

  it("should filter stats by goals, assists, and own_goals", async () => {
    const mockStats = [
      {
        player_id: "p1",
        player_name: "Alice",
        goal: 10,
        peladas_played: 5,
        assist: 5,
        own_goal: 0,
      },
      {
        player_id: "p2",
        player_name: "Bob",
        goal: 5,
        peladas_played: 5,
        assist: 0,
        own_goal: 2,
      },
    ] as any;
    mockApi.getOrganizationStatistics.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() => expect(result.current.stats).toHaveLength(2));
    await waitFor(() => expect(result.current.org).not.toBeNull());

    // Filter by minGoals
    await act(async () => {
      result.current.setMinGoals("8");
    });
    expect(result.current.sortedStats).toHaveLength(1);
    expect(result.current.sortedStats[0].player_name).toBe("Alice");

    // Reset minGoals, Filter by minAssists
    await act(async () => {
      result.current.setMinGoals("");
      result.current.setMinAssists("3");
    });
    expect(result.current.sortedStats).toHaveLength(1);
    expect(result.current.sortedStats[0].player_name).toBe("Alice");

    // Reset minAssists, Filter by minOwnGoals
    await act(async () => {
      result.current.setMinAssists("");
      result.current.setMinOwnGoals("1");
    });
    expect(result.current.sortedStats).toHaveLength(1);
    expect(result.current.sortedStats[0].player_name).toBe("Bob");
  });

  it("should handle organization load errors with non-Error objects", async () => {
    mockApi.getOrganization.mockRejectedValue("String Org Error");
    const { result } = renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() =>
      expect(result.current.error).toBe(
        "organizations.stats.error.load_org_failed",
      ),
    );
  });

  it("should handle statistics load errors with non-Error objects", async () => {
    mockApi.getOrganizationStatistics.mockRejectedValue("String Stats Error");
    const { result } = renderHook(() => useOrganizationStatistics(orgId));
    await waitFor(() =>
      expect(result.current.error).toBe(
        "organizations.stats.error.load_stats_failed",
      ),
    );
  });
});
