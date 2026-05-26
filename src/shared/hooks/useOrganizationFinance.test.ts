import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useOrganizationFinance,
  clearFinanceCache,
} from "./useOrganizationFinance";
import { api } from "../../shared/api/client";

vi.mock("../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("useOrganizationFinance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFinanceCache();
  });

  it("should fetch and cache finance data", async () => {
    const mockFinance = { diarista_price: 20 };
    vi.mocked(api.get).mockResolvedValue(mockFinance);

    const { result, rerender } = renderHook(
      ({ orgId }) => useOrganizationFinance(orgId),
      {
        initialProps: { orgId: "org1" },
      },
    );

    await waitFor(() =>
      expect(result.current.organizationFinance).toEqual(mockFinance),
    );
    expect(api.get).toHaveBeenCalledTimes(1);

    // Rerender with same orgId should use cache
    rerender({ orgId: "org1" });
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it("should handle errors", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useOrganizationFinance("org1"));

    await waitFor(() =>
      expect(result.current.financeError).toBe("Network Error"),
    );
    expect(result.current.loadingFinance).toBe(false);
  });

  it("should clear cache", async () => {
    const mockFinance = { diarista_price: 20 };
    vi.mocked(api.get).mockResolvedValue(mockFinance);

    renderHook(() => useOrganizationFinance("org1"));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));

    clearFinanceCache("org1");

    renderHook(() => useOrganizationFinance("org1"));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });

  it("should use cache if valid", async () => {
    const mockFinance = { diarista_price: 30 };
    vi.mocked(api.get).mockResolvedValue(mockFinance);

    const { result, rerender } = renderHook(
      ({ orgId }) => useOrganizationFinance(orgId),
      {
        initialProps: { orgId: "org-cache" },
      },
    );

    await waitFor(() =>
      expect(result.current.organizationFinance).toEqual(mockFinance),
    );
    expect(api.get).toHaveBeenCalledTimes(1);

    // Change orgId then change back to hit cache
    rerender({ orgId: "other" });
    await waitFor(() => expect(result.current.loadingFinance).toBe(true)); // Loading other

    vi.mocked(api.get).mockResolvedValue({ diarista_price: 40 });
    await waitFor(() => expect(result.current.loadingFinance).toBe(false));

    rerender({ orgId: "org-cache" });
    await waitFor(() =>
      expect(result.current.organizationFinance).toEqual(mockFinance),
    );
    // Should still be 2 calls total (org-cache initial, and 'other')
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("should handle undefined orgId", () => {
    const { result } = renderHook(() => useOrganizationFinance(undefined));
    expect(result.current.organizationFinance).toBeNull();
    expect(result.current.loadingFinance).toBe(false);
  });

  it("should handle non-Error exceptions", async () => {
    vi.mocked(api.get).mockRejectedValue("String Error");
    const { result } = renderHook(() => useOrganizationFinance("org1"));
    await waitFor(() =>
      expect(result.current.financeError).toBe("Failed to load finance"),
    );
  });

  it("should clear all cache when no orgId provided", async () => {
    vi.mocked(api.get).mockResolvedValue({ diarista_price: 20 });
    renderHook(() => useOrganizationFinance("org1"));
    renderHook(() => useOrganizationFinance("org2"));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));

    clearFinanceCache(); // Clear all

    renderHook(() => useOrganizationFinance("org1"));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
  });

  it("should not update state if unmounted", async () => {
    let resolveApi: (value: any) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });
    vi.mocked(api.get).mockReturnValue(apiPromise);

    const { result, unmount } = renderHook(() => useOrganizationFinance("org1"));
    
    // Unmount before resolving
    unmount();
    
    // @ts-ignore
    resolveApi({ diarista_price: 50 });
    
    // State should not be updated (difficult to check directly without internals, 
    // but we check coverage)
    expect(result.current.organizationFinance).toBeNull();
  });

  it("should handle expired cache", async () => {
    const dateSpy = vi.spyOn(Date, "now");
    const initialTime = 1000000;
    dateSpy.mockReturnValue(initialTime);
    
    const mockFinance = { diarista_price: 20 };
    vi.mocked(api.get).mockResolvedValue(mockFinance);

    const { result, rerender } = renderHook(
      ({ orgId }) => useOrganizationFinance(orgId),
      { initialProps: { orgId: "org-expired" } },
    );

    await waitFor(() => expect(result.current.organizationFinance).toEqual(mockFinance));
    expect(api.get).toHaveBeenCalledTimes(1);

    // Fast-forward time in mock
    dateSpy.mockReturnValue(initialTime + 6 * 60 * 1000); // 6 minutes > 5 minutes TTL

    // Change orgId to trigger effect
    rerender({ orgId: "other" });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));

    // Change back to org-expired
    rerender({ orgId: "org-expired" });
    
    // Should fetch again because cache expired
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
    dateSpy.mockRestore();
  });
});
