/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useHomeDashboard } from "./useHomeDashboard";

// Stable mocks
const stableTranslation = {
  t: (key: string) => key,
  i18n: { language: "en", changeLanguage: vi.fn() },
};
vi.mock("react-i18next", () => ({
  useTranslation: () => stableTranslation,
}));

const mockUser = { id: "user-123", name: "Test User" };
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    refreshUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn(),
    isLoggedIn: true,
    isAdmin: false,
  })),
}));

const { mockApiClient } = vi.hoisted(() => ({
  mockApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    getPaginated: vi
      .fn()
      .mockResolvedValue({ data: [], page: 1, totalPages: 1 }),
  },
}));

vi.mock("../../../shared/api/client", () => ({
  api: mockApiClient,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  getUser: vi.fn(),
  updateUserProfile: vi.fn(),
}));

describe("useHomeDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient.get.mockResolvedValue([]);
    mockApiClient.post.mockResolvedValue({});
    mockApiClient.getPaginated.mockResolvedValue({
      data: [],
      page: 1,
      totalPages: 1,
    });
  });

  it("should initialize and fetch data", async () => {
    const mockOrgs = [{ id: "org-1", name: "Admin Org", role: "admin" }];
    mockApiClient.get.mockImplementation((url: string) => {
      if (url.includes("/organizations")) return Promise.resolve(mockOrgs);
      if (url.includes("/invitations/pending")) return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useHomeDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 3000,
    });
    expect(result.current.adminOrgs).toHaveLength(1);
  });

  it("should handle acceptInvitation successfully", async () => {
    const { result } = renderHook(() => useHomeDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 3000,
    });
    await act(async () => {
      await result.current.acceptInvitation("token123");
    });
    expect(mockApiClient.post).toHaveBeenCalledWith(
      expect.stringContaining("token123/accept"),
      expect.anything(),
    );
  });

  it("should handle handlePeladaPageChange", async () => {
    const { result } = renderHook(() => useHomeDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.handlePeladaPageChange({} as any, 2);
    });

    expect(mockApiClient.getPaginated).toHaveBeenCalledWith(
      expect.stringContaining("/peladas"),
      expect.objectContaining({ page: 2 }),
    );
  });

  it("should handle createOrganization successfully", async () => {
    const { result } = renderHook(() => useHomeDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createOrganization("New Org");
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/api/organizations",
      expect.objectContaining({ name: "New Org" }),
    );
  });

  it("should correctly set peladasTotal from the paginated API response", async () => {
    mockApiClient.getPaginated.mockResolvedValue({
      data: [{ id: "pelada-1" }, { id: "pelada-2" }],
      page: 1,
      totalPages: 3,
      total: 15,
    });

    const { result } = renderHook(() => useHomeDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.peladasTotal).toBe(15);
    expect(result.current.peladas).toHaveLength(2);
  });

  it("should handle updateAttendance successfully", async () => {
    mockApiClient.getPaginated.mockResolvedValue({
      data: [{ id: "pelada-1", user_attendance_status: null }],
      page: 1,
      totalPages: 1,
      total: 1,
    });

    const { result } = renderHook(() => useHomeDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateAttendance("pelada-1", "confirmed");
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      expect.stringContaining("/api/peladas/pelada-1/attendance"),
      expect.objectContaining({ status: "confirmed" }),
    );
  });

  it("shows the new status before the request comes back", async () => {
    mockApiClient.getPaginated.mockResolvedValue({
      data: [{ id: "pelada-1", user_attendance_status: null }],
      page: 1,
      totalPages: 1,
      total: 1,
    });
    let resolvePost: (value: unknown) => void = () => {};
    mockApiClient.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );

    const { result } = renderHook(() => useHomeDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.updateAttendance("pelada-1", "confirmed");
    });

    await waitFor(() =>
      expect((result.current.peladas[0] as any).user_attendance_status).toBe(
        "confirmed",
      ),
    );

    await act(async () => {
      resolvePost({});
      await pending;
    });
  });

  it("refetches so the server value replaces the optimistic one", async () => {
    mockApiClient.getPaginated
      .mockResolvedValueOnce({
        data: [{ id: "pelada-1", user_attendance_status: null }],
        page: 1,
        totalPages: 1,
        total: 1,
      })
      .mockResolvedValue({
        // The pelada was full, so the server put the player on the waitlist.
        data: [{ id: "pelada-1", user_attendance_status: "waitlist" }],
        page: 1,
        totalPages: 1,
        total: 1,
      });
    mockApiClient.post.mockResolvedValue({});

    const { result } = renderHook(() => useHomeDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateAttendance("pelada-1", "confirmed");
    });

    expect((result.current.peladas[0] as any).user_attendance_status).toBe(
      "waitlist",
    );
  });

  it("rolls back and rethrows when the update fails", async () => {
    mockApiClient.getPaginated.mockResolvedValue({
      data: [{ id: "pelada-1", user_attendance_status: "declined" }],
      page: 1,
      totalPages: 1,
      total: 1,
    });
    mockApiClient.post.mockRejectedValue(new Error("network down"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { result } = renderHook(() => useHomeDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(
        result.current.updateAttendance("pelada-1", "confirmed"),
      ).rejects.toThrow("network down");
    });

    // The refetch restored what the server actually holds.
    expect((result.current.peladas[0] as any).user_attendance_status).toBe(
      "declined",
    );
    consoleError.mockRestore();
  });

  it("only touches the pelada being updated", async () => {
    mockApiClient.getPaginated.mockResolvedValue({
      data: [
        { id: "pelada-1", user_attendance_status: null },
        { id: "pelada-2", user_attendance_status: "declined" },
      ],
      page: 1,
      totalPages: 1,
      total: 2,
    });
    let resolvePost: (value: unknown) => void = () => {};
    mockApiClient.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );

    const { result } = renderHook(() => useHomeDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.updateAttendance("pelada-1", "confirmed");
    });

    await waitFor(() =>
      expect((result.current.peladas[0] as any).user_attendance_status).toBe(
        "confirmed",
      ),
    );
    expect((result.current.peladas[1] as any).user_attendance_status).toBe(
      "declined",
    );

    await act(async () => {
      resolvePost({});
      await pending;
    });
  });
});
