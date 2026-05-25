import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useHomeDashboard } from "./useHomeDashboard";
import { api } from "../../../shared/api/client";
import { useAuth } from "../../../app/providers/AuthContext";

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
  },
}));

// Mock AuthContext
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("useHomeDashboard", () => {
  const mockUser = { id: "user-123", name: "Test User" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
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
    });
  });

  it("should initialize and fetch data", async () => {
    const mockOrgs = [
      { id: "org-1", name: "Admin Org", role: "admin" },
      { id: "org-2", name: "Member Org", role: "player" },
    ];
    const mockPeladas = { data: [], page: 1, totalPages: 1 };
    const mockInvites = [];

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes("/api/users/user-123/organizations")) return Promise.resolve(mockOrgs);
      if (url.includes("/api/users/user-123/peladas")) return Promise.resolve(mockPeladas);
      if (url.includes("/api/invitations/pending")) return Promise.resolve(mockInvites);
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useHomeDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.adminOrgs).toHaveLength(1);
    expect(result.current.adminOrgs[0].name).toBe("Admin Org");
    expect(result.current.memberOrgs).toHaveLength(1);
    expect(result.current.memberOrgs[0].name).toBe("Member Org");
  });

  it("should handle blocked user", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...mockUser, is_blocked: true },
      refreshUser: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
      isLoggedIn: true,
      isAdmin: false,
    });

    const { result } = renderHook(() => useHomeDashboard());

    expect(result.current.loading).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });
});
