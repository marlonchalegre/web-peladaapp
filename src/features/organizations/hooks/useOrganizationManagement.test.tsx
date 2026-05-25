import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOrganizationManagement } from "./useOrganizationManagement";
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

describe("useOrganizationManagement", () => {
  const orgId = "test-org-id";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with loading true", async () => {
    // Return a promise that never resolves for the initial fetchData call
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useOrganizationManagement(orgId), { wrapper });
      hookResult = result;
    });
    
    expect(hookResult.current.loading).toBe(true);
  });

  it("should fetch data successfully", async () => {
    const mockOrg = { id: orgId, name: "Test Org" };
    const mockPlayers = [{ id: "p1", name: "Player 1", user_id: "u1", user_name: "User 1", user_username: "user1" }];
    const mockAdmins = [{ user_id: "u1", name: "Admin 1" }];
    const mockInvitations = [];
    const mockSubstitutions = [];

    // Promise.all in useOrganizationManagement calls these endpoints
    // Note: client.get returns data directly in this setup
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes(`/api/organizations/${orgId}/players`)) return Promise.resolve(mockPlayers);
      if (url.includes(`/api/organizations/${orgId}/admins`)) return Promise.resolve(mockAdmins);
      if (url.includes(`/api/organizations/${orgId}/invitations`)) return Promise.resolve(mockInvitations);
      if (url.includes(`/api/organizations/${orgId}/substitutions`)) return Promise.resolve(mockSubstitutions);
      if (url.includes(`/api/organizations/${orgId}`)) return Promise.resolve(mockOrg);
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useOrganizationManagement(orgId), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.org).toEqual(mockOrg);
    expect(result.current.players).toEqual(mockPlayers);
    expect(result.current.admins).toEqual(mockAdmins);
  });
});
