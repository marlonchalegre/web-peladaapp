/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import PeladaDetailPage from "./PeladaDetailPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { api } from "../../../shared/api/client";
import { useAuth } from "../../../app/providers/AuthContext";

// Mock the API client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => (key === "common.locale_code" ? "pt-BR" : key),
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
}));

vi.mock("../components/FixedGoalkeepersSection", () => ({
  default: () => <div data-testid="mock-fixed-gk-section" />,
}));

vi.mock("../components/PeladaDetailHeader", () => ({
  default: ({
    pelada,
    onStartClick,
    onCopyClipboard,
    onCopyAnnouncement,
  }: any) => (
    <div data-testid="mock-detail-header">
      <button data-testid="start-pelada-button" onClick={onStartClick}>
        Start
      </button>
      {!pelada.has_schedule_plan && (
        <button data-testid="build-schedule-button">Build</button>
      )}
      <button data-testid="export-menu-button" onClick={onCopyClipboard}>
        Export
      </button>
      <button data-testid="copy-clipboard-button" onClick={onCopyClipboard}>
        Copy Clip
      </button>
      <button
        data-testid="copy-announcement-button"
        onClick={onCopyAnnouncement}
      >
        Copy Ann
      </button>
    </div>
  ),
}));

// Mock the nested subcomponents to test container page logic directly
vi.mock("../components/TeamsSection", () => ({
  default: ({
    onMoveToTeam,
    onCreateTeam,
    onReversePayment,
    onMarkPaid,
    dropToTeam,
    onSendToBench,
    onMoveToFixedGk,
    onDeleteTeam,
  }: any) => (
    <div data-testid="mock-teams-section">
      <button
        data-testid="trigger-move-player"
        onClick={() => onMoveToTeam?.("11", "1")} // Move Player 2 (id "11") to Team 1 (id "1")
      >
        Move Player
      </button>
      <button
        data-testid="trigger-delete-team"
        onClick={() => {
          onDeleteTeam?.("1");
        }}
      >
        Delete Team
      </button>
      <button
        data-testid="trigger-create-team"
        onClick={() => onCreateTeam?.("New Team")}
      >
        Create Team
      </button>
      <button
        data-testid="trigger-reverse-payment"
        onClick={() => onReversePayment?.("10")} // Player 1 (id "10")
      >
        Reverse Payment
      </button>
      <button
        data-testid="trigger-mark-paid"
        onClick={() => onMarkPaid?.("10", 20)}
      >
        Mark Paid
      </button>
      <button
        data-testid="trigger-drop-to-team"
        onClick={() => {
          const e = {
            preventDefault: vi.fn(),
            dataTransfer: {
              getData: vi
                .fn()
                .mockReturnValue(
                  JSON.stringify({ playerId: "11", sourceTeamId: null }),
                ),
            },
          } as any;
          dropToTeam?.(e, "1");
        }}
      >
        Drop To Team
      </button>
      <button
        data-testid="trigger-drop-to-team-same"
        onClick={() => {
          const e = {
            preventDefault: vi.fn(),
            dataTransfer: {
              getData: vi
                .fn()
                .mockReturnValue(
                  JSON.stringify({ playerId: "10", sourceTeamId: "1" }),
                ),
            },
          } as any;
          dropToTeam?.(e, "1");
        }}
      >
        Drop To Team Same
      </button>
      <button
        data-testid="trigger-drop-to-team-invalid-json"
        onClick={() => {
          const e = {
            preventDefault: vi.fn(),
            dataTransfer: {
              getData: vi.fn().mockReturnValue("invalid-json"),
            },
          } as any;
          dropToTeam?.(e, "1");
        }}
      >
        Drop To Team Invalid JSON
      </button>
      <button
        data-testid="trigger-drop-to-team-empty-data"
        onClick={() => {
          const e = {
            preventDefault: vi.fn(),
            dataTransfer: {
              getData: vi.fn().mockReturnValue(""),
            },
          } as any;
          dropToTeam?.(e, "1");
        }}
      >
        Drop To Team Empty Data
      </button>
      <button
        data-testid="trigger-send-to-bench"
        onClick={() => onSendToBench?.("10")}
      >
        Send to Bench
      </button>
      <button
        data-testid="trigger-send-to-bench-not-found"
        onClick={() => onSendToBench?.("999")}
      >
        Send to Bench Not Found
      </button>
      <button
        data-testid="trigger-move-to-fixed-gk"
        onClick={() => onMoveToFixedGk?.("10", "home")}
      >
        Move to Fixed GK
      </button>
    </div>
  ),
}));

vi.mock("../components/AvailablePlayersPanel", () => ({
  default: ({
    onDropToBench,
    onDragStartPlayer,
    onAddPlayersFromOrg,
    isAdmin,
    onMarkPaid,
    onReversePayment,
    onMoveToTeam,
    onMoveToFixedGk,
  }: any) => (
    <div data-testid="mock-available-players">
      {isAdmin && <span data-testid="admin-bench-indicator" />}
      <button
        data-testid="trigger-add-players-from-org"
        onClick={() => onAddPlayersFromOrg?.(["12"])}
      >
        Add Players from Org
      </button>
      <button
        data-testid="trigger-drop-to-bench"
        onClick={() => {
          const e = {
            preventDefault: vi.fn(),
            dataTransfer: {
              getData: vi
                .fn()
                .mockReturnValue(
                  JSON.stringify({ playerId: "10", sourceTeamId: "1" }),
                ),
            },
          } as any;
          onDropToBench?.(e);
        }}
      >
        Drop to Bench
      </button>
      <button
        data-testid="trigger-drop-to-bench-invalid"
        onClick={() => {
          const e = {
            preventDefault: vi.fn(),
            dataTransfer: {
              getData: vi.fn().mockReturnValue("invalid"),
            },
          } as any;
          onDropToBench?.(e);
        }}
      >
        Drop to Bench Invalid
      </button>
      <button
        data-testid="trigger-drag-start-player"
        onClick={() => {
          const e = {
            dataTransfer: {
              setData: vi.fn(),
              effectAllowed: "none",
            },
          } as any;
          onDragStartPlayer?.(e, "10");
        }}
      >
        Drag Start
      </button>
      <button
        data-testid="trigger-bench-mark-paid"
        onClick={() => onMarkPaid?.("10", 25)}
      >
        Bench Mark Paid
      </button>
      <button
        data-testid="trigger-bench-reverse-payment"
        onClick={() => onReversePayment?.("10")}
      >
        Bench Reverse Payment
      </button>
      <button
        data-testid="trigger-bench-move-to-team"
        onClick={() => onMoveToTeam?.("11", "1")}
      >
        Bench Move to Team
      </button>
      <button
        data-testid="trigger-bench-move-to-fixed-gk"
        onClick={() => onMoveToFixedGk?.("10", "home")}
      >
        Bench Move to Fixed GK
      </button>
    </div>
  ),
}));

vi.mock("../components/FixedGoalkeepersSection", () => ({
  default: () => <div data-testid="mock-fixed-goalkeepers" />,
}));

describe("PeladaDetailPage", () => {
  let user: UserEvent;

  const mockFullDetails = {
    pelada: {
      id: "1",
      organization_id: "101",
      status: "open",
      players_per_team: 5,
      has_schedule_plan: true,
      fixed_goalkeepers: true,
    },
    teams: [
      {
        id: "1",
        name: "Time 1",
        players: [
          { id: "10", user_id: "1", user: { id: "1", name: "Player 1" } },
        ],
      },
    ],
    available_players: [
      { id: "11", user_id: "2", user: { id: "2", name: "Player 2" } },
    ],
    users_map: {
      1: { id: "1", name: "Player 1" },
      2: { id: "2", name: "Player 2" },
    },
    org_players_map: {
      10: { id: "10", user_id: "1" },
      11: { id: "11", user_id: "2" },
    },
    voting_info: { can_vote: false, has_voted: false, eligible_players: [] },
    pelada_transactions: [
      {
        id: "tx-1",
        player_id: "10",
        type: "income",
        category: "diarista_fee",
        status: "paid",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    (useAuth as Mock).mockReturnValue({
      user: { id: "1", name: "Test User", admin_orgs: ["101"] },
      isAuthenticated: true,
    });
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins")
        return Promise.resolve([{ user_id: "1" }]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ base_price: 10 });
      return Promise.resolve({});
    });
    (api.post as Mock).mockResolvedValue({});
    (api.put as Mock).mockResolvedValue({});
    (api.delete as Mock).mockResolvedValue({});
  });

  const renderPage = () =>
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/peladas/1"]}>
          <Routes>
            <Route path="/peladas/:id" element={<PeladaDetailPage />} />
            <Route
              path="/peladas/:id/matches"
              element={<div>Matches Page</div>}
            />
            <Route
              path="/peladas/:id/attendance"
              element={<div>Attendance Page</div>}
            />
            <Route
              path="/peladas/:id/voting"
              element={<div>Voting Page</div>}
            />
            <Route
              path="/peladas/:id/results"
              element={<div>Results Page</div>}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

  it("renders pelada details and teams with child sections", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("mock-teams-section")).toBeInTheDocument();
      expect(screen.getByTestId("mock-available-players")).toBeInTheDocument();
    });
  });

  it("handles start pelada action", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("start-pelada-button")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("start-pelada-button"));

    // Should show start dialog (confirm start with schedule plan)
    await waitFor(() =>
      expect(screen.getByTestId("pretty-confirm-button")).toBeInTheDocument(),
    );
    const confirmBtn = screen.getByTestId("pretty-confirm-button");
    await user.click(confirmBtn);
    expect(api.post).toHaveBeenCalledWith(
      expect.stringContaining("/begin"),
      expect.anything(),
    );
  });

  it("handles creating a new team", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("trigger-create-team")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("trigger-create-team"));
    expect(api.post).toHaveBeenCalledWith(
      "/api/teams",
      expect.objectContaining({ pelada_id: "1" }),
    );
  });

  it("hides admin actions when user is not an admin", async () => {
    (useAuth as Mock).mockReturnValue({
      user: { id: "not-admin", name: "Regular User", admin_orgs: [] },
      isAuthenticated: true,
    });
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ base_price: 10 });
      return Promise.resolve({});
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.queryByTestId("start-pelada-button"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("admin-bench-indicator"),
      ).not.toBeInTheDocument();
    });
  });

  it("displays error banner when loading details fails", async () => {
    (api.get as Mock).mockRejectedValue(new Error("API Load Error"));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("API Load Error")).toBeInTheDocument();
    });
  });

  it("handles swap player dialog flow when team is full", async () => {
    const fullTeamDetails = {
      ...mockFullDetails,
      pelada: {
        ...mockFullDetails.pelada,
        players_per_team: 1,
      },
    };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(fullTeamDetails);
      if (path === "/api/organizations/101/admins")
        return Promise.resolve([{ user_id: "1" }]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ base_price: 10 });
      return Promise.resolve({});
    });

    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("trigger-move-player")).toBeInTheDocument(),
    );
    // Trigger moving Player 2 (id "11") to Team 1 (id "1") which is full (max 1 player, already has Player 1)
    await user.click(screen.getByTestId("trigger-move-player"));

    // Verify SwapPlayerDialog is opened
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByText("Player 1")).toBeInTheDocument();

    // Select Player 1 to be replaced
    await user.click(screen.getByText("Player 1"));

    // Confirm that api endpoints were called:
    // 1. remove player 1 ("10") from team 1 ("1")
    // 2. add player 2 ("11") to team 1 ("1")
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams/1/players"),
        expect.objectContaining({ player_id: "10" }),
      );
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams/1/players"),
        expect.objectContaining({ player_id: "11", is_goalkeeper: false }),
      );
    });
  });

  it("handles payment reversal dialog and triggers reversal action", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("trigger-reverse-payment")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("trigger-reverse-payment"));

    // Wait for confirm button to appear and click it
    const confirmBtn = await screen.findByTestId("pretty-confirm-button");
    await user.click(confirmBtn);

    // Check endpoints reverseTransaction was called
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/organizations/101/finance/transactions/tx-1/reverse",
        ),
      );
    });
  });

  it("handles clipboard copies for export and announcements", async () => {
    // Mock navigator.clipboard.writeText
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });

    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("export-menu-button")).toBeInTheDocument(),
    );

    // Open export menu
    await user.click(screen.getByTestId("export-menu-button"));

    // Wait for menu items and Export text
    await waitFor(() =>
      expect(screen.getByTestId("copy-clipboard-button")).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("copy-clipboard-button"));
    expect(mockClipboard.writeText).toHaveBeenCalled();

    // Re-open menu for Announcement text (it closes after click)
    await user.click(screen.getByTestId("export-menu-button"));
    await waitFor(() =>
      expect(
        screen.getByTestId("copy-announcement-button"),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByTestId("copy-announcement-button"));
    expect(mockClipboard.writeText).toHaveBeenCalled();
  });

  it("handles listAdminsByOrganization edge cases: user is admin vs not admin vs reject", async () => {
    (useAuth as Mock).mockReturnValue({
      user: { id: "u2", name: "User 2", admin_orgs: [] },
      isAuthenticated: true,
    });

    // 1. listAdminsByOrganization returns admin list containing u2
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins")
        return Promise.resolve([{ user_id: "u2" }]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ base_price: 10 });
      return Promise.resolve({});
    });

    const { unmount } = renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("start-pelada-button")).toBeInTheDocument();
    });
    unmount();

    // 2. listAdminsByOrganization rejects
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins")
        return Promise.reject(new Error("check fail"));
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ base_price: 10 });
      return Promise.resolve({});
    });

    renderPage();
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it("handles start pelada dialog when has_schedule_plan is false", async () => {
    const customDetails = {
      ...mockFullDetails,
      pelada: {
        ...mockFullDetails.pelada,
        has_schedule_plan: false,
      },
    };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(customDetails);
      if (path === "/api/organizations/101/admins")
        return Promise.resolve([{ user_id: "1" }]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ base_price: 10 });
      return Promise.resolve({});
    });

    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("build-schedule-button")).toBeInTheDocument(),
    );
  });

  it("covers helper actions handleSendToBench, handleMoveToFixedGk, and dropToTeam drag/drop swaps", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("mock-teams-section")).toBeInTheDocument(),
    );

    // 1. Move player (NOT swapping because team is not full)
    await user.click(screen.getByTestId("trigger-move-player"));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams/1/players"),
        expect.objectContaining({ player_id: "11", is_goalkeeper: false }),
      ),
    );
    vi.clearAllMocks();

    // Move player to SAME team (should call dropToTeam immediately, but dropToTeam returns early if sourceTeamId === targetTeamId)
    await user.click(screen.getByTestId("trigger-drop-to-team-same"));
    // Since it returns early, api.post should NOT be called
    expect(api.post).not.toHaveBeenCalled();
    vi.clearAllMocks();

    // 2. Mark paid trigger from mock
    await user.click(screen.getByTestId("trigger-mark-paid"));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("/finance/transactions"),
        expect.objectContaining({ player_id: "10", amount: 20 }),
      ),
    );
    vi.clearAllMocks();

    // 3. dropToTeam triggers
    await user.click(screen.getByTestId("trigger-drop-to-team"));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams/1/players"),
        expect.objectContaining({ player_id: "11", is_goalkeeper: false }),
      ),
    );

    await user.click(screen.getByTestId("trigger-drop-to-team-same"));
    await user.click(screen.getByTestId("trigger-drop-to-team-invalid-json"));
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());

    await user.click(screen.getByTestId("trigger-drop-to-team-empty-data"));

    // 4. Send to bench
    await user.click(screen.getByTestId("trigger-send-to-bench"));
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams/1/players"),
        expect.objectContaining({ player_id: "10" }),
      ),
    );

    await user.click(screen.getByTestId("trigger-send-to-bench-not-found"));

    // 5. Move to fixed GK
    await user.click(screen.getByTestId("trigger-move-to-fixed-gk"));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/1"),
        expect.objectContaining({ home_fixed_goalkeeper_id: "10" }),
      ),
    );

    consoleSpy.mockRestore();
  });

  it("displays loading state when pelada is null", async () => {
    (api.get as Mock).mockReturnValue(new Promise(() => {})); // Never resolves
    renderPage();
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("renders correctly when fixed goalkeepers are disabled", async () => {
    const customDetails = {
      ...mockFullDetails,
      pelada: {
        ...mockFullDetails.pelada,
        fixed_goalkeepers: false,
      },
    };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(customDetails);
      return Promise.resolve({});
    });

    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByTestId("mock-fixed-gk-section"),
      ).not.toBeInTheDocument(),
    );
  });

  it("handles delete team successfully", async () => {
    (api.delete as Mock).mockResolvedValue({});
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("mock-teams-section")).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId("trigger-delete-team"));
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams/1"),
      ),
    );
  });

  it("handles start dialog confirm with schedule open", async () => {
    (api.post as Mock).mockResolvedValue({});
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("start-pelada-button")).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId("start-pelada-button"));
    // PrettyConfirmDialog for schedule open uses common.confirm title
    await waitFor(() =>
      expect(screen.getByText("common.confirm")).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId("pretty-confirm-button"));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("/begin"),
        expect.anything(),
      ),
    );
  });

  it("handles closed pelada alerts when voting info can_vote is false", async () => {
    const closedDetails = {
      ...mockFullDetails,
      pelada: {
        ...mockFullDetails.pelada,
        status: "closed",
      },
      voting_info: {
        can_vote: false,
        has_voted: false,
        message: "Voting Closed Message",
      },
    };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(closedDetails);
      if (path === "/api/organizations/101/admins")
        return Promise.resolve([{ user_id: "1" }]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ base_price: 10 });
      return Promise.resolve({});
    });

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/peladas/1"]}>
          <Routes>
            <Route path="/peladas/:id" element={<PeladaDetailPage />} />
            <Route
              path="/peladas/:id/results"
              element={<div>Results Page Content</div>}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Results Page Content")).toBeInTheDocument();
    });
  });

  it("handles start dialog confirm when has_schedule_plan is false and handles failed api begins", async () => {
    const customDetails = {
      ...mockFullDetails,
      pelada: {
        ...mockFullDetails.pelada,
        has_schedule_plan: false,
      },
    };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(customDetails);
      if (path === "/api/organizations/101/admins")
        return Promise.resolve([{ user_id: "1" }]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ base_price: 10 });
      return Promise.resolve({});
    });

    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("start-pelada-button")).toBeInTheDocument(),
    );

    // 1. Open StartPeladaDialog
    await user.click(screen.getByTestId("start-pelada-button"));

    // Verify it is open
    await waitFor(() =>
      expect(
        screen.getByLabelText("peladas.dialog.start.matches_per_team"),
      ).toBeInTheDocument(),
    );

    // 2. Change matches per team
    const matchesInput = screen.getByLabelText(
      "peladas.dialog.start.matches_per_team",
    );
    await user.clear(matchesInput);
    await user.type(matchesInput, "3");

    // 3. Confirm failure path
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: "Failed to begin pelada" },
      },
    };
    (api.post as Mock).mockRejectedValueOnce(axiosError);

    await user.click(screen.getByTestId("confirm-start-pelada-button"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining("/begin"), {
        matches_per_team: 3,
      });
    });
  });

  it("covers SwapPlayerDialog onClose", async () => {
    const fullTeamDetails = {
      ...mockFullDetails,
      pelada: {
        ...mockFullDetails.pelada,
        players_per_team: 1,
      },
    };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(fullTeamDetails);
      return Promise.resolve({});
    });

    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("trigger-move-player")).toBeInTheDocument(),
    );

    // Trigger moving player to open SwapPlayerDialog
    await user.click(screen.getByTestId("trigger-move-player"));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    // Click Cancel in SwapPlayerDialog
    const cancelBtn = screen.getByRole("button", { name: "common.cancel" });
    await user.click(cancelBtn);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("covers PrettyConfirmDialog for reverse payment onClose", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("trigger-reverse-payment")).toBeInTheDocument(),
    );

    // Open reverse payment dialog
    await user.click(screen.getByTestId("trigger-reverse-payment"));
    await waitFor(() => {
      expect(screen.getByText("finance.reversal.title")).toBeInTheDocument();
    });

    // Click Cancel in dialog
    const cancelBtn = screen.getByRole("button", { name: "common.cancel" });
    await user.click(cancelBtn);

    await waitFor(() =>
      expect(
        screen.queryByText("finance.reversal.title"),
      ).not.toBeInTheDocument(),
    );
  });

  it("covers AvailablePlayersPanel callbacks on drag, drop, payments, and moves", async () => {
    (api.post as Mock).mockResolvedValue({});
    (api.delete as Mock).mockResolvedValue({});
    (api.put as Mock).mockResolvedValue({});

    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("trigger-drop-to-bench")).toBeInTheDocument(),
    );

    // 1. Drop to Bench (valid JSON)
    await user.click(screen.getByTestId("trigger-drop-to-bench"));
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams/1/players"),
        expect.objectContaining({ player_id: "10" }),
      );
    });

    // 2. Drop to Bench (invalid JSON)
    await user.click(screen.getByTestId("trigger-drop-to-bench-invalid"));
    // should not crash or call API
    expect(api.delete).toHaveBeenCalledTimes(1);

    // 3. Drag Start
    await user.click(screen.getByTestId("trigger-drag-start-player"));
    // should execute drag start logic without crashing

    // 4. Bench Mark Paid
    await user.click(screen.getByTestId("trigger-bench-mark-paid"));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/101/finance/transactions"),
        expect.objectContaining({ player_id: "10", amount: 25 }),
      );
    });

    // 5. Bench Reverse Payment
    await user.click(screen.getByTestId("trigger-bench-reverse-payment"));
    await waitFor(() => {
      expect(screen.getByText("finance.reversal.title")).toBeInTheDocument();
    });
    // Click confirm to cover handleConfirmReverse
    const confirmBtn = screen.getAllByRole("button", {
      name: "common.confirm",
    })[0];
    await user.click(confirmBtn);
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/organizations/101/finance/transactions/tx-1/reverse",
        ),
      );
    });

    // 6. Bench Move to Team
    await user.click(screen.getByTestId("trigger-bench-move-to-team"));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams/1/players"),
        expect.objectContaining({ player_id: "11", is_goalkeeper: false }),
      );
    });

    // 7. Bench Move to Fixed GK
    await user.click(screen.getByTestId("trigger-bench-move-to-fixed-gk"));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/1"),
        expect.objectContaining({ home_fixed_goalkeeper_id: "10" }),
      );
    });
  });
});
