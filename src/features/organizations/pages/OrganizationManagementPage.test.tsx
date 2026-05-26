/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import OrganizationManagementPage from "./OrganizationManagementPage";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useOrganizationManagement } from "../hooks/useOrganizationManagement";
import { useAuth } from "../../../app/providers/AuthContext";

vi.mock("../hooks/useOrganizationManagement");
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: vi.fn(() => ({ user: { id: "u1" } })),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: any) => key }),
}));

// Mock all nested components to isolate page container layout & tab switcher logic
vi.mock("../components/MembersSection", () => ({
  default: ({ onAddClick, onInviteClick }: any) => (
    <div data-testid="mock-members-section">
      <button data-testid="members-add-button" onClick={onAddClick}>
        Add
      </button>
      <button data-testid="members-invite-button" onClick={onInviteClick}>
        Invite
      </button>
    </div>
  ),
}));
vi.mock("../components/FinanceSection", () => ({
  default: () => <div data-testid="mock-finance-section">Finance Section</div>,
}));
vi.mock("../components/SubstitutionsSection", () => ({
  default: () => (
    <div data-testid="mock-substitutions-section">Substitutions Section</div>
  ),
}));
vi.mock("../components/PlayerRatingsContent", () => ({
  default: () => <div data-testid="mock-ratings-content">Player Ratings</div>,
}));
vi.mock("../components/AdminsSection", () => ({
  default: () => <div data-testid="mock-admins-section">Admins Section</div>,
}));
vi.mock("../components/InvitationsList", () => ({
  default: ({ onResetLink }: any) => (
    <div data-testid="mock-invitations-list">
      <button data-testid="reset-public-link-button" onClick={onResetLink}>
        Reset
      </button>
    </div>
  ),
}));
vi.mock("../components/WahaConfigSection", () => ({
  default: () => <div data-testid="mock-waha-section">Waha Config</div>,
}));
vi.mock("../components/DangerZoneSection", () => ({
  default: ({ onDeleteClick }: any) => (
    <div data-testid="mock-danger-zone-section">
      <button data-testid="danger-zone-delete-button" onClick={onDeleteClick}>
        Delete
      </button>
    </div>
  ),
}));

describe("OrganizationManagementPage", () => {
  let mockHook: any;

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as Mock).mockReturnValue({ user: { id: "u1" } });
    mockHook = {
      org: { id: "1", name: "Org 1" },
      players: [{ id: "p1", user_id: "u2" }],
      admins: [{ user_id: "u1" }],
      invitations: [{ id: "i1", email: "test@test.com", status: "pending" }],
      substitutions: [{ id: "s1", player_id: "p1", status: "active" }],
      loading: false,
      error: null,
      setError: vi.fn(),
      actionLoading: false,
      isAddPlayersOpen: false,
      setIsAddPlayersOpen: vi.fn(),
      isInviteOpen: false,
      setIsInviteOpen: vi.fn(),
      publicInviteLink: "http://invite.link",
      invitedUser: null,
      setInvitedUser: vi.fn(),
      selectedUserIds: new Set(),
      setSelectedUserIds: vi.fn(),
      selectedAdminUserId: "",
      setSelectedAdminUserId: vi.fn(),
      isDeleteDialogOpen: false,
      setIsDeleteDialogOpen: vi.fn(),
      confirmOrgName: "",
      setConfirmOrgName: vi.fn(),
      usersMap: new Map([["u2", { id: "u2", name: "Player 1" }]]),
      playersNotAdmins: [{ id: "p1", user_id: "u2", user_name: "Player 1" }],
      handleRemovePlayer: vi.fn(),
      handleUpdatePlayer: vi.fn(),
      handleRevokeInvitation: vi.fn(),
      handleResetInviteLink: vi.fn(),
      handleAddAdmin: vi.fn(),
      handleRemoveAdmin: vi.fn(),
      handleAddPlayers: vi.fn(),
      handleInvitePlayer: vi.fn(),
      handleDeleteOrganization: vi.fn(),
      handleCreateSubstitution: vi.fn(),
      handleEndSubstitution: vi.fn(),
      refreshPlayers: vi.fn(),
      fetchInviteLink: vi.fn(),
      fetchData: vi.fn(),
    };
    (useOrganizationManagement as any).mockReturnValue(mockHook);
  });

  const renderPage = (initialTab = "members") => {
    return render(
      <MemoryRouter
        initialEntries={[`/organizations/1/manage?tab=${initialTab}`]}
      >
        <Routes>
          <Route
            path="/organizations/:id/manage"
            element={<OrganizationManagementPage />}
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  it("renders correctly and displays members by default", () => {
    renderPage("members");
    expect(screen.getByTestId("org-mgmt-container")).toBeInTheDocument();
    expect(screen.getByTestId("mock-members-section")).toBeInTheDocument();
  });

  it("switches to finance tab and renders FinanceSection", () => {
    renderPage("finance");
    expect(screen.getByTestId("mock-finance-section")).toBeInTheDocument();
  });

  it("switches to substitutions tab and renders SubstitutionsSection", () => {
    renderPage("substitutions");
    expect(
      screen.getByTestId("mock-substitutions-section"),
    ).toBeInTheDocument();
  });

  it("switches to ratings tab and renders PlayerRatingsContent", () => {
    renderPage("ratings");
    expect(screen.getByTestId("mock-ratings-content")).toBeInTheDocument();
  });

  it("switches to admins tab and renders AdminsSection", () => {
    renderPage("admins");
    expect(screen.getByTestId("mock-admins-section")).toBeInTheDocument();
  });

  it("switches to invitations tab and renders InvitationsList", () => {
    renderPage("invitations");
    expect(screen.getByTestId("mock-invitations-list")).toBeInTheDocument();
  });

  it("switches to waha tab and renders WahaConfigSection", () => {
    renderPage("waha");
    expect(screen.getByTestId("mock-waha-section")).toBeInTheDocument();
  });

  it("switches to settings tab and renders DangerZoneSection", () => {
    renderPage("settings");
    expect(screen.getByTestId("mock-danger-zone-section")).toBeInTheDocument();
  });

  it("opens add players dialog and triggers handleAddPlayers on confirm", () => {
    mockHook.isAddPlayersOpen = true;
    mockHook.selectedUserIds = new Set(["u3"]);
    renderPage("members");

    const confirmBtn = screen.getByText(
      "organizations.dialog.add_players.add_selected",
    );
    fireEvent.click(confirmBtn);
    expect(mockHook.handleAddPlayers).toHaveBeenCalled();
  });

  it("opens invite player dialog and triggers handleInvitePlayer on invite", async () => {
    mockHook.isInviteOpen = true;
    renderPage("members");

    // Simulate typing email input
    const input = screen.getByTestId("invite-email-input");
    act(() => {
      fireEvent.change(input, { target: { value: "test@test.com" } });
    });

    const inviteBtn = screen.getByTestId("send-invite-button");
    await act(async () => {
      fireEvent.click(inviteBtn);
    });
    expect(mockHook.handleInvitePlayer).toHaveBeenCalled();
  });

  it("opens delete organization dialog and triggers handleDeleteOrganization on delete", () => {
    mockHook.isDeleteDialogOpen = true;
    mockHook.confirmOrgName = "Org 1"; // set confirmName to match org.name
    renderPage("settings");

    const deleteBtn = screen.getByTestId("confirm-delete-org-button");
    fireEvent.click(deleteBtn);
    expect(mockHook.handleDeleteOrganization).toHaveBeenCalled();
  });

  it("opens reset invite link confirm dialog and triggers handleResetInviteLink on confirm", () => {
    renderPage("invitations");
    const resetBtn = screen.getByTestId("reset-public-link-button");
    fireEvent.click(resetBtn);

    const confirmBtn = screen.getByTestId("pretty-confirm-button");
    fireEvent.click(confirmBtn);
    expect(mockHook.handleResetInviteLink).toHaveBeenCalled();
  });

  it("closes add players dialog when cancel is clicked", () => {
    mockHook.isAddPlayersOpen = true;
    renderPage("members");
    const cancelBtn = screen.getByRole("button", { name: "common.cancel" });
    fireEvent.click(cancelBtn);
    expect(mockHook.setIsAddPlayersOpen).toHaveBeenCalledWith(false);
  });

  it("closes invite dialog and resets/clears invitation state", () => {
    mockHook.isInviteOpen = true;
    mockHook.invitedUser = { email: "invited@user.com", isNew: true, token: "tok" };
    renderPage("members");

    const closeBtn = screen.getByTestId("invite-dialog-close-button");
    fireEvent.click(closeBtn);

    expect(mockHook.setIsInviteOpen).toHaveBeenCalledWith(false);
    expect(mockHook.setInvitedUser).toHaveBeenCalledWith(null);
  });

  it("handles public link reset confirmation trigger and dialog close", async () => {
    mockHook.isInviteOpen = true;
    mockHook.publicInviteLink = "http://public.link";
    mockHook.isResetConfirmOpen = true; // Simulating confirm dialog open
    renderPage("members");

    // Click on reset button in InvitePlayerDialog
    const resetIconBtn = screen.getByTestId("reset-public-link-button");
    fireEvent.click(resetIconBtn);
    
    // Close PrettyConfirmDialog
    const cancelConfirmBtn = screen.getByRole("button", { name: "common.cancel" });
    fireEvent.click(cancelConfirmBtn);
    
    // Check that PrettyConfirmDialog title is closed/no longer in document
    await waitFor(() => {
      expect(screen.queryByText("organizations.management.reset_invite_link_title")).not.toBeInTheDocument();
    });
  });

  it("handles null user and null admins edge cases for admin checks", () => {
    (useAuth as Mock).mockReturnValue({ user: null });
    mockHook.admins = null;
    renderPage("members");
    expect(screen.getByTestId("org-mgmt-container")).toBeInTheDocument();
  });

  it("renders error fallback banner when org is null", () => {
    mockHook.org = null;
    mockHook.error = "Failed to load org data";
    renderPage("members");
    expect(screen.getByText("Failed to load org data")).toBeInTheDocument();
  });
  
  it("renders default error message when org is null and no error is set", () => {
    mockHook.org = null;
    mockHook.error = null;
    renderPage("members");
    expect(screen.getByText("organizations.error.load_failed")).toBeInTheDocument();
  });

  it("renders loading state when loading is true and org is null", () => {
    mockHook.org = null;
    mockHook.loading = true;
    renderPage("members");
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });
});
