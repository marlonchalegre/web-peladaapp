/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOrganizationManagement } from "./useOrganizationManagement";
import { MemoryRouter } from "react-router-dom";

// Stable mocks
const stableTranslation = {
  t: (key: string) => key,
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
    isAdmin: true,
  }),
}));

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    getOrganization: vi.fn(),
    listPlayersByOrg: vi.fn(),
    listAdminsByOrganization: vi.fn(),
    listOrganizationInvitations: vi.fn(),
    listSubstitutions: vi.fn(),
    getInviteLink: vi.fn(),
    resetInviteLink: vi.fn(),
    deletePlayer: vi.fn(),
    updatePlayer: vi.fn(),
    addOrganizationAdmin: vi.fn(),
    removeOrganizationAdmin: vi.fn(),
    invitePlayer: vi.fn(),
    createPlayer: vi.fn(),
    revokeInvitation: vi.fn(),
    updateOrganization: vi.fn(),
    deleteOrganization: vi.fn(),
    createSubstitution: vi.fn(),
    endSubstitution: vi.fn(),
    addPlayersToOrganization: vi.fn(),
  },
}));

vi.mock("../../../shared/api/endpoints", () => ({
  createApi: vi.fn(() => mockApi),
}));

describe("useOrganizationManagement", () => {
  const orgId = "org1";
  const mockOrg = { id: "org1", name: "Test Org" };
  const mockPlayers = [
    {
      id: "p1",
      name: "Player 1",
      user_id: "u1",
      user_name: "User 1",
      user_username: "user1",
    },
  ];
  const mockAdmins = [
    { user_id: "u1", name: "Admin 1" },
    { user_id: "u2", name: "Admin 2" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.confirm = vi.fn().mockReturnValue(true);

    Object.values(mockApi).forEach((m) => {
      if (typeof (m as any).mockResolvedValue === "function")
        (m as any).mockResolvedValue({});
    });

    mockApi.getOrganization.mockResolvedValue(mockOrg);
    mockApi.listPlayersByOrg.mockResolvedValue(mockPlayers);
    mockApi.listAdminsByOrganization.mockResolvedValue(mockAdmins);
    mockApi.listOrganizationInvitations.mockResolvedValue([]);
    mockApi.listSubstitutions.mockResolvedValue([]);
    mockApi.getInviteLink.mockResolvedValue({ token: "token123" });
  });

  // Success paths
  it("should initialize and fetch data", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 2000,
    });
    expect(result.current.org).toEqual(mockOrg);
  });

  it("should handle handleRemovePlayer successfully", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.handleRemovePlayer("p1");
    });
    expect(mockApi.deletePlayer).toHaveBeenCalledWith("p1");
  });

  it("should handle handleAddAdmin successfully", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      result.current.setSelectedAdminUserId("u3");
    });
    await act(async () => {
      await result.current.handleAddAdmin();
    });
    expect(mockApi.addOrganizationAdmin).toHaveBeenCalledWith(orgId, "u3");
  });

  // Error paths
  it("should handle fetchData error with Error object and string", async () => {
    mockApi.getOrganization.mockRejectedValue(new Error("Load Error"));
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Load Error");

    // Re-fetch with non-Error object
    mockApi.getOrganization.mockRejectedValue("String Load Error");
    await act(async () => {
      await result.current.fetchData(false);
    });
    expect(result.current.error).toBe("organizations.error.load_failed");
  });

  it("should handle listSubstitutions error silently", async () => {
    mockApi.listSubstitutions.mockRejectedValue(new Error("Sub List Error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should support fetching invite link with silent option and handle error scenarios", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // silent = false
    mockApi.getInviteLink.mockResolvedValue({ token: "new-token-1" });
    await act(async () => {
      await result.current.fetchInviteLink(false);
    });
    expect(result.current.publicInviteLink).toContain("new-token-1");

    // error Error object
    mockApi.getInviteLink.mockRejectedValue(new Error("Token Error"));
    await act(async () => {
      await result.current.fetchInviteLink(false);
    });
    expect(result.current.error).toBe("Token Error");

    // error non-Error
    mockApi.getInviteLink.mockRejectedValue("String Token Error");
    await act(async () => {
      await result.current.fetchInviteLink(false);
    });
    expect(result.current.error).toBe("organizations.error.fetch_invite_link_failed");
  });

  it("should handle handleResetInviteLink success and error scenarios", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockApi.resetInviteLink.mockResolvedValue({ token: "reset-token" });
    mockApi.listOrganizationInvitations.mockResolvedValue([{ id: "inv1", email: "invited@test.com" }]);
    await act(async () => {
      await result.current.handleResetInviteLink();
    });
    expect(result.current.publicInviteLink).toContain("reset-token");
    expect(result.current.invitations).toHaveLength(1);

    // Reset error with Error object
    mockApi.resetInviteLink.mockRejectedValue(new Error("Reset Fail"));
    await act(async () => {
      await result.current.handleResetInviteLink();
    });
    expect(result.current.error).toBe("Reset Fail");

    // Reset error with non-Error
    mockApi.resetInviteLink.mockRejectedValue("String Reset Fail");
    await act(async () => {
      await result.current.handleResetInviteLink();
    });
    expect(result.current.error).toBe("organizations.error.reset_failed");
  });

  it("should refresh players and handle errors silently", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockApi.listPlayersByOrg.mockResolvedValue([{ id: "p2", name: "Player 2" }]);
    await act(async () => {
      await result.current.refreshPlayers();
    });
    expect(result.current.players).toEqual([{ id: "p2", name: "Player 2" }]);

    // Error scenario
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockApi.listPlayersByOrg.mockRejectedValue(new Error("Refresh Fail"));
    await act(async () => {
      await result.current.refreshPlayers();
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should handle handleRemovePlayer cancellation and error paths", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Cancel deletion
    window.confirm = vi.fn().mockReturnValue(false);
    await act(async () => {
      await result.current.handleRemovePlayer("p1");
    });
    expect(mockApi.deletePlayer).not.toHaveBeenCalled();

    // Confirm but fail with Error
    window.confirm = vi.fn().mockReturnValue(true);
    mockApi.deletePlayer.mockRejectedValue(new Error("Remove Fail"));
    await act(async () => {
      await result.current.handleRemovePlayer("p1");
    });
    expect(result.current.error).toBe("Remove Fail");

    // Confirm but fail with non-Error
    mockApi.deletePlayer.mockRejectedValue("String Remove Fail");
    await act(async () => {
      await result.current.handleRemovePlayer("p1");
    });
    expect(result.current.error).toBe("organizations.error.delete_failed");
  });

  it("should handle handleUpdatePlayer success and error paths", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleUpdatePlayer("p1", { name: "Updated Name" });
    });
    expect(mockApi.updatePlayer).toHaveBeenCalledWith("p1", { name: "Updated Name" });

    // Update error Error object
    mockApi.updatePlayer.mockRejectedValue(new Error("Update Fail"));
    await act(async () => {
      await result.current.handleUpdatePlayer("p1", { name: "Updated Name" });
    });
    expect(result.current.error).toBe("Update Fail");

    // Update error non-Error
    mockApi.updatePlayer.mockRejectedValue("String Update Fail");
    await act(async () => {
      await result.current.handleUpdatePlayer("p1", { name: "Updated Name" });
    });
    expect(result.current.error).toBe("organizations.error.update_player_failed");
  });

  it("should handle handleRevokeInvitation success, cancel and error paths", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Cancel
    window.confirm = vi.fn().mockReturnValue(false);
    await act(async () => {
      await result.current.handleRevokeInvitation("inv1");
    });
    expect(mockApi.revokeInvitation).not.toHaveBeenCalled();

    // Confirm and succeed
    window.confirm = vi.fn().mockReturnValue(true);
    await act(async () => {
      await result.current.handleRevokeInvitation("inv1");
    });
    expect(mockApi.revokeInvitation).toHaveBeenCalledWith(orgId, "inv1");

    // Confirm and Error object fail
    mockApi.revokeInvitation.mockRejectedValue(new Error("Revoke Fail"));
    await act(async () => {
      await result.current.handleRevokeInvitation("inv1");
    });
    expect(result.current.error).toBe("Revoke Fail");

    // Confirm and non-Error fail
    mockApi.revokeInvitation.mockRejectedValue("String Revoke Fail");
    await act(async () => {
      await result.current.handleRevokeInvitation("inv1");
    });
    expect(result.current.error).toBe("organizations.error.revoke_failed");
  });

  it("should handle handleAddAdmin empty select, success and error paths", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Empty select
    await act(async () => {
      await result.current.handleAddAdmin();
    });
    expect(mockApi.addOrganizationAdmin).not.toHaveBeenCalled();

    // Succeed
    await act(async () => {
      result.current.setSelectedAdminUserId("u3");
    });
    await act(async () => {
      await result.current.handleAddAdmin();
    });
    expect(mockApi.addOrganizationAdmin).toHaveBeenCalledWith(orgId, "u3");
    expect(result.current.selectedAdminUserId).toBe("");

    // Error object fail
    await act(async () => {
      result.current.setSelectedAdminUserId("u3");
    });
    mockApi.addOrganizationAdmin.mockRejectedValue(new Error("Add Admin Fail"));
    await act(async () => {
      await result.current.handleAddAdmin();
    });
    expect(result.current.error).toBe("Add Admin Fail");

    // non-Error fail
    await act(async () => {
      result.current.setSelectedAdminUserId("u3");
    });
    mockApi.addOrganizationAdmin.mockRejectedValue("String Add Admin Fail");
    await act(async () => {
      await result.current.handleAddAdmin();
    });
    expect(result.current.error).toBe("organizations.error.add_admin_failed");
  });

  it("should handle handleRemoveAdmin validation, success and error paths", async () => {
    // Override default admins to have 2 admins so it doesn't fail on length === 1
    mockApi.listAdminsByOrganization.mockResolvedValue([
      { user_id: "u1", name: "Admin 1" },
      { user_id: "u2", name: "Admin 2" },
    ]);

    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Succeed
    await act(async () => {
      await result.current.handleRemoveAdmin("u2");
    });
    expect(mockApi.removeOrganizationAdmin).toHaveBeenCalledWith(orgId, "u2");

    // Fails on length === 1
    result.current.admins.pop(); // force length to 1
    await act(async () => {
      await result.current.handleRemoveAdmin("u1");
    });
    expect(result.current.error).toBe("organizations.error.remove_last_admin");

    // Error object fail
    mockApi.listAdminsByOrganization.mockResolvedValue([
      { user_id: "u1", name: "Admin 1" },
      { user_id: "u2", name: "Admin 2" },
    ]);
    await act(async () => {
      await result.current.fetchData(true);
    });
    mockApi.removeOrganizationAdmin.mockRejectedValue(new Error("Remove Admin Fail"));
    await act(async () => {
      await result.current.handleRemoveAdmin("u2");
    });
    expect(result.current.error).toBe("Remove Admin Fail");

    // non-Error fail
    mockApi.removeOrganizationAdmin.mockRejectedValue("String Remove Admin Fail");
    await act(async () => {
      await result.current.handleRemoveAdmin("u2");
    });
    expect(result.current.error).toBe("organizations.error.remove_admin_failed");
  });

  it("should handle handleAddPlayers with explicit ids, selectedUserIds, success and error paths", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Explicit IDs
    await act(async () => {
      await result.current.handleAddPlayers(["u10", "u11"]);
    });
    expect(mockApi.createPlayer).toHaveBeenCalledWith({ organization_id: orgId, user_id: "u10" });
    expect(mockApi.createPlayer).toHaveBeenCalledWith({ organization_id: orgId, user_id: "u11" });

    // Fallback to selectedUserIds
    await act(async () => {
      result.current.setSelectedUserIds(new Set(["u20"]));
    });
    await act(async () => {
      await result.current.handleAddPlayers();
    });
    expect(mockApi.createPlayer).toHaveBeenCalledWith({ organization_id: orgId, user_id: "u20" });
    expect(result.current.isAddPlayersOpen).toBe(false);
    expect(result.current.selectedUserIds.size).toBe(0);

    // Error object fail
    mockApi.createPlayer.mockRejectedValue(new Error("Create Player Fail"));
    await act(async () => {
      await result.current.handleAddPlayers(["u30"]);
    });
    expect(result.current.error).toBe("Create Player Fail");

    // non-Error fail
    mockApi.createPlayer.mockRejectedValue("String Create Player Fail");
    await act(async () => {
      await result.current.handleAddPlayers(["u30"]);
    });
    expect(result.current.error).toBe("organizations.error.add_players_failed");
  });

  it("should handle handleInvitePlayer error with non-Error", async () => {
    mockApi.invitePlayer.mockRejectedValue("Non-Error Invite Fail");
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.handleInvitePlayer("e@t.com", "N");
    });
    expect(result.current.error).toBe("Non-Error Invite Fail");
  });

  it("should handle handleCreateSubstitution error with non-Error", async () => {
    mockApi.createSubstitution.mockRejectedValue("Non-Error Sub Fail");
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.handleCreateSubstitution("p1", "p2", "2024-01-01");
    });
    expect(result.current.error).toBe("Non-Error Sub Fail");
  });

  it("should handle handleEndSubstitution success and error paths", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleEndSubstitution("sub1", "2024-01-02");
    });
    expect(mockApi.endSubstitution).toHaveBeenCalledWith(orgId, "sub1", "2024-01-02");

    // Error with Error
    mockApi.endSubstitution.mockRejectedValue(new Error("End Sub Fail"));
    await act(async () => {
      await result.current.handleEndSubstitution("sub1");
    });
    expect(result.current.error).toBe("End Sub Fail");

    // Error with non-Error
    mockApi.endSubstitution.mockRejectedValue("Non-Error End Sub Fail");
    await act(async () => {
      await result.current.handleEndSubstitution("sub1");
    });
    expect(result.current.error).toBe("Non-Error End Sub Fail");
  });

  it("should handle handleDeleteOrganization validation, success and error paths", async () => {
    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Fails on confirmOrgName mismatch
    await act(async () => {
      await result.current.handleDeleteOrganization();
    });
    expect(mockApi.deleteOrganization).not.toHaveBeenCalled();

    // Succeeds
    await act(async () => {
      result.current.setConfirmOrgName("Test Org");
    });
    await act(async () => {
      await result.current.handleDeleteOrganization();
    });
    expect(mockApi.deleteOrganization).toHaveBeenCalledWith(orgId);

    // Non-Error reject
    mockApi.deleteOrganization.mockRejectedValue("Non-Error Delete Fail");
    await act(async () => {
      result.current.setConfirmOrgName("Test Org");
    });
    await act(async () => {
      await result.current.handleDeleteOrganization();
    });
    expect(result.current.error).toBe("Non-Error Delete Fail");
  });

  it("should handle edge cases in usersMap and playersNotAdmins memoization", async () => {
    // Player with missing user information
    mockApi.listPlayersByOrg.mockResolvedValue([
      { id: "p1", name: "Player 1", user_id: "u1", user_name: "User 1", user_username: "user1" },
      { id: "p2", name: "Player 2" } // missing user_id/user_name/user_username
    ]);
    mockApi.listAdminsByOrganization.mockResolvedValue([
      { user_id: "u1", name: "Admin 1", user_name: "Admin 1", user_username: "admin1" },
      { user_id: "u3", name: "Admin 3" } // missing user_name/user_username
    ]);

    const { result } = renderHook(() => useOrganizationManagement(orgId), {
      wrapper: MemoryRouter,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.usersMap.has("u1")).toBe(true);
    expect(result.current.usersMap.has("u3")).toBe(false);

    // check player that has no user_id mapping fallback in playersNotAdmins
    // Since player 2 has no user_id, playersNotAdmins should contain a default user object for player 2
    const pNotAdmins = result.current.playersNotAdmins;
    expect(pNotAdmins).toHaveLength(1);
    expect(pNotAdmins.find(u => u.name === "Player 2" || u.name === "User")).toBeTruthy();
  });
});

