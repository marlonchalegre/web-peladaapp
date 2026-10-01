import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AttendanceListPage from "./AttendanceListPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../../../shared/api/client";

// Mock the API client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      admin_orgs: [],
    },
    isAuthenticated: true,
  }),
}));

import { clearFinanceCache } from "../../../shared/hooks/useOrganizationFinance";

describe("AttendanceListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFinanceCache();
  });

  it("renders attendance list and tabs", async () => {
    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
      },
      available_players: [
        {
          id: "10",
          user_id: "1",
          attendance_status: "confirmed",
          user: { id: "1", name: "Confirmed Player", position: "Striker" },
        },
        {
          id: "11",
          user_id: "2",
          attendance_status: "waitlist",
          user: { id: "2", name: "Waitlist Player", position: "Goalkeeper" },
        },
        {
          id: "12",
          user_id: "3",
          attendance_status: "pending",
          user: { id: "3", name: "Pending Player", position: "Defender" },
        },
        {
          id: "13",
          user_id: "4",
          attendance_status: "declined",
          user: { id: "4", name: "Declined Player", position: "Midfielder" },
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getAllByText("peladas.attendance.title").length,
      ).toBeGreaterThan(0);
      // Check for tabs
      expect(
        screen.getByText(/peladas.attendance.status.confirmed/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/peladas.attendance.status.waitlist/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/peladas.attendance.status.pending/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/peladas.attendance.status.declined/),
      ).toBeInTheDocument();

      // Initially confirmed tab should be visible
      expect(screen.getByText("Confirmed Player")).toBeInTheDocument();
    });
  });

  it("renders desktop 5b view when screen is md or wider", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
      },
      available_players: [
        {
          id: "10",
          user_id: "1",
          attendance_status: "confirmed",
          user: { id: "1", name: "Confirmed Player", position: "Striker" },
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("peladas.attendance.desktop.spots_label"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("peladas.attendance.desktop.daily_fees_title"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("peladas.attendance.desktop.your_response"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("peladas.attendance.desktop.will_play"),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText("peladas.attendance.desktop.waitlist").length,
      ).toBeGreaterThan(0);
      expect(
        screen.getByText("peladas.attendance.desktop.wont_play"),
      ).toBeInTheDocument();
      expect(screen.getByText("Confirmed Player")).toBeInTheDocument();
    });
  });

  it("passes target player id when admin removes a player or promotes waitlist player in mobile view", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
        is_admin: true,
      },
      available_players: [
        {
          id: "10",
          user_id: "2",
          attendance_status: "confirmed",
          user: { id: "2", name: "Confirmed Player", position: "Striker" },
        },
        {
          id: "11",
          user_id: "3",
          attendance_status: "waitlist",
          user: { id: "3", name: "Waitlist Player", position: "Goalkeeper" },
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    (api.post as Mock).mockResolvedValue(1);

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Confirmed Player")).toBeInTheDocument();
    });

    const removeBtn = screen.getByTitle("peladas.attendance.remove_from_list");
    fireEvent.click(removeBtn);

    expect(api.post).toHaveBeenCalledWith(
      "/api/peladas/1/attendance",
      expect.objectContaining({
        status: "declined",
        player_id: "10",
      }),
    );

    const promoteBtn = screen.getByTitle(
      "peladas.attendance.promote_to_confirmed",
    );
    fireEvent.click(promoteBtn);

    expect(api.post).toHaveBeenCalledWith(
      "/api/peladas/1/attendance",
      expect.objectContaining({
        status: "confirmed",
        player_id: "11",
      }),
    );
  });

  it("copies attendance list to clipboard in desktop view", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
      },
      available_players: [
        {
          id: "10",
          user_id: "1",
          attendance_status: "confirmed",
          member_type: "mensalista",
          user: { id: "1", name: "Confirmed Player", position: "Striker" },
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/copy_list|copiar lista/i)).toBeInTheDocument();
    });

    const copyBtn = screen.getByText(/copy_list|copiar lista/i);
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
  });

  it("renders SecureAvatar for confirmed player in attendance list", async () => {
    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
      },
      available_players: [
        {
          id: "10",
          user_id: "1",
          attendance_status: "confirmed",
          member_type: "mensalista",
          user_avatar_filename: "player-avatar.png",
          user: {
            id: "1",
            name: "Confirmed Player",
            position: "Striker",
            avatar_filename: "player-avatar.png",
          },
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Confirmed Player")).toBeInTheDocument();
    });

    const avatars = screen.getAllByTestId("secure-avatar");
    expect(avatars.length).toBeGreaterThan(0);
    expect(avatars.some((a) => a.textContent === "CP")).toBe(true);
  });

  it("displays MENSALISTA badge for mensalista_temporario in confirmed list", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
      },
      available_players: [
        {
          id: "10",
          user_id: "10",
          attendance_status: "confirmed",
          member_type: "mensalista_temporario",
          user: { id: "10", name: "Jorge Batista", position: "Striker" },
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Jorge Batista")).toBeInTheDocument();
    });

    const playerCard = screen.getByTestId("player-card");
    expect(playerCard).toHaveTextContent("MENSALISTA");
    expect(playerCard).not.toHaveTextContent("DIARISTA");
  });

  it("allows admin to view pending list by clicking pending stat tab and manipulate presence, absence, and payment", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
        is_admin: true,
      },
      available_players: [
        {
          id: "10",
          user_id: "1",
          attendance_status: "confirmed",
          member_type: "mensalista",
          user: { id: "1", name: "Confirmed Player", position: "Striker" },
        },
        {
          id: "20",
          user_id: "2",
          attendance_status: "pending",
          member_type: "diarista",
          user: { id: "2", name: "Pending Diarista", position: "Midfielder" },
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ diarista_price: 30, mensalista_price: 100 });
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.post as Mock).mockResolvedValue(1);

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Confirmed Player")).toBeInTheDocument();
    });

    // In confirmed view, pending player should not be in the confirmed list
    expect(screen.queryByText("Pending Diarista")).not.toBeInTheDocument();

    // Click on PENDENT. stat tab
    const pendingTab = screen.getByTestId("stat-tab-pending");
    fireEvent.click(pendingTab);

    // Pending player should now be visible
    expect(screen.getByText("Pending Diarista")).toBeInTheDocument();

    // Admin can confirm presence ("marcar a presença")
    const confirmBtn = screen.getByTestId("confirm-player-button");
    fireEvent.click(confirmBtn);

    expect(api.post).toHaveBeenCalledWith(
      "/api/peladas/1/attendance",
      expect.objectContaining({
        status: "confirmed",
        player_id: "20",
      }),
    );

    // Admin can decline absence ("marcar ausência")
    const declineBtn = screen.getByTestId("decline-player-button");
    fireEvent.click(declineBtn);

    expect(api.post).toHaveBeenCalledWith(
      "/api/peladas/1/attendance",
      expect.objectContaining({
        status: "declined",
        player_id: "20",
      }),
    );

    // Admin can mark payment ("marcar pago")
    const markPaidBtn = screen.getByTestId("mark-paid-button");
    fireEvent.click(markPaidBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/api/organizations/101/finance/transactions",
        expect.objectContaining({
          player_id: "20",
          amount: 30,
          type: "income",
          category: "diarista_fee",
        }),
      );
    });
  });

  it("allows admin to view declined list by clicking declined stat tab and confirm or waitlist a player", async () => {
    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
        is_admin: true,
      },
      available_players: [
        {
          id: "10",
          user_id: "1",
          attendance_status: "confirmed",
          member_type: "mensalista",
          user: { id: "1", name: "Confirmed Player", position: "Striker" },
        },
        {
          id: "30",
          user_id: "3",
          attendance_status: "declined",
          member_type: "convidado",
          user: { id: "3", name: "Declined Player", position: "Midfielder" },
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ diarista_price: 30 });
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.post as Mock).mockResolvedValue(1);

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Confirmed Player")).toBeInTheDocument();
    });

    // Click on RECUSAS (declined) stat tab
    const declinedTab = screen.getByTestId("stat-tab-declined");
    fireEvent.click(declinedTab);

    expect(screen.getByText("Declined Player")).toBeInTheDocument();

    // Admin can confirm presence
    const confirmBtn = screen.getByTestId("confirm-player-button");
    fireEvent.click(confirmBtn);

    expect(api.post).toHaveBeenCalledWith(
      "/api/peladas/1/attendance",
      expect.objectContaining({
        status: "confirmed",
        player_id: "30",
      }),
    );

    // Admin can move to waitlist
    const waitlistBtn = screen.getByTestId("waitlist-player-button");
    fireEvent.click(waitlistBtn);

    expect(api.post).toHaveBeenCalledWith(
      "/api/peladas/1/attendance",
      expect.objectContaining({
        status: "waitlist",
        player_id: "30",
      }),
    );
  });

  it("allows admin to view waitlist tab and promote or decline a waitlist player", async () => {
    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
        is_admin: true,
      },
      available_players: [
        {
          id: "10",
          user_id: "1",
          attendance_status: "confirmed",
          member_type: "mensalista",
          user: { id: "1", name: "Confirmed Player", position: "Striker" },
        },
        {
          id: "40",
          user_id: "4",
          attendance_status: "waitlist",
          member_type: "diarista",
          user: { id: "4", name: "Waitlisted Player", position: "Defender" },
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ diarista_price: 30 });
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.post as Mock).mockResolvedValue(1);

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Confirmed Player")).toBeInTheDocument();
    });

    // Click on ESPERA (waitlist) stat tab
    const waitlistTab = screen.getByTestId("stat-tab-waitlist");
    fireEvent.click(waitlistTab);

    expect(screen.getByText("Waitlisted Player")).toBeInTheDocument();

    // Admin can promote to confirmed
    const promoteBtn = screen.getByTestId("promote-waitlist-button");
    fireEvent.click(promoteBtn);

    expect(api.post).toHaveBeenCalledWith(
      "/api/peladas/1/attendance",
      expect.objectContaining({
        status: "confirmed",
        player_id: "40",
      }),
    );

    // Admin can decline from waitlist
    const declineBtn = screen.getByTestId("decline-player-button");
    fireEvent.click(declineBtn);

    expect(api.post).toHaveBeenCalledWith(
      "/api/peladas/1/attendance",
      expect.objectContaining({
        status: "declined",
        player_id: "40",
      }),
    );
  });

  it("allows admin to reverse payment for a player who already paid", async () => {
    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
        is_admin: true,
      },
      available_players: [
        {
          id: "20",
          user_id: "2",
          attendance_status: "pending",
          member_type: "diarista",
          user: { id: "2", name: "Paid Diarista", position: "Midfielder" },
        },
      ],
      pelada_transactions: [
        {
          id: "tx-999",
          player_id: "20",
          pelada_id: "1",
          amount: 30,
          type: "income",
          category: "diarista_fee",
          status: "paid",
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ diarista_price: 30 });
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.post as Mock).mockResolvedValue(1);

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("stat-tab-pending")).toBeInTheDocument();
    });

    // Go to pending tab
    fireEvent.click(screen.getByTestId("stat-tab-pending"));
    expect(screen.getByText("Paid Diarista")).toBeInTheDocument();

    // Reverse payment button is displayed instead of mark-paid
    const reverseBtn = screen.getByTestId("reverse-payment-button");
    expect(reverseBtn).toBeInTheDocument();

    fireEvent.click(reverseBtn);

    expect(api.post).toHaveBeenCalledWith(
      "/api/organizations/101/finance/transactions/tx-999/reverse",
    );
  });

  it("allows non-admin to switch tabs but hides admin action buttons", async () => {
    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
        is_admin: false,
      },
      available_players: [
        {
          id: "10",
          user_id: "100",
          attendance_status: "confirmed",
          member_type: "mensalista",
          user: { id: "100", name: "Confirmed Other", position: "Striker" },
        },
        {
          id: "20",
          user_id: "200",
          attendance_status: "pending",
          member_type: "diarista",
          user: { id: "200", name: "Pending Other", position: "Defender" },
        },
        {
          id: "30",
          user_id: "300",
          attendance_status: "declined",
          member_type: "diarista",
          user: { id: "300", name: "Declined Other", position: "Midfielder" },
        },
        {
          id: "40",
          user_id: "400",
          attendance_status: "waitlist",
          member_type: "diarista",
          user: { id: "400", name: "Waitlist Other", position: "Goalkeeper" },
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ diarista_price: 30 });
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Confirmed Other")).toBeInTheDocument();
    });

    // Check confirmed tab - no decline button
    expect(
      screen.queryByTestId("decline-player-button"),
    ).not.toBeInTheDocument();

    // Check pending tab
    fireEvent.click(screen.getByTestId("stat-tab-pending"));
    expect(screen.getByText("Pending Other")).toBeInTheDocument();
    expect(
      screen.queryByTestId("confirm-player-button"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("mark-paid-button")).not.toBeInTheDocument();

    // Check declined tab
    fireEvent.click(screen.getByTestId("stat-tab-declined"));
    expect(screen.getByText("Declined Other")).toBeInTheDocument();
    expect(
      screen.queryByTestId("confirm-player-button"),
    ).not.toBeInTheDocument();

    // Check waitlist tab
    fireEvent.click(screen.getByTestId("stat-tab-waitlist"));
    expect(screen.getByText("Waitlist Other")).toBeInTheDocument();
    expect(
      screen.queryByTestId("promote-waitlist-button"),
    ).not.toBeInTheDocument();
  });

  it("handles pagination expand and collapse when list has more than 10 players", async () => {
    const twelvePending = Array.from({ length: 12 }, (_, i) => {
      const num = String(i + 1).padStart(2, "0");
      return {
        id: `p-${num}`,
        user_id: `u-${num}`,
        attendance_status: "pending",
        member_type: "diarista",
        user: {
          id: `u-${num}`,
          name: `Pending Player ${num}`,
          position: "Midfielder",
        },
      };
    });

    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
        is_admin: true,
      },
      available_players: twelvePending,
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ diarista_price: 30 });
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("stat-tab-pending")).toBeInTheDocument();
    });

    // Go to pending tab
    fireEvent.click(screen.getByTestId("stat-tab-pending"));

    // Player 01 to 10 are visible, Player 11 is not yet visible
    expect(screen.getByText("Pending Player 01")).toBeInTheDocument();
    expect(screen.getByText("Pending Player 10")).toBeInTheDocument();
    expect(screen.queryByText("Pending Player 11")).not.toBeInTheDocument();

    // Click VER TODOS OS 12 →
    const expandBtn = screen.getByText("VER TODOS OS 12 →");
    fireEvent.click(expandBtn);

    // Player 11 and 12 are now visible
    expect(screen.getByText("Pending Player 11")).toBeInTheDocument();
    expect(screen.getByText("Pending Player 12")).toBeInTheDocument();

    // Click MOSTRAR MENOS ↑
    const collapseBtn = screen.getByText("MOSTRAR MENOS ↑");
    fireEvent.click(collapseBtn);

    // Collapsed back to 10
    expect(screen.queryByText("Pending Player 11")).not.toBeInTheDocument();
  });

  it("handles empty lists gracefully and member_type fallback to diarista", async () => {
    const mockFullDetails = {
      pelada: {
        id: "1",
        organization_id: "101",
        organization_name: "Test Org",
        status: "attendance",
        is_admin: true,
      },
      available_players: [
        {
          id: "50",
          user_id: "5",
          attendance_status: "pending",
          // member_type is undefined
          user: { id: "5", name: "Player No MemberType", position: "Striker" },
        },
      ],
      teams: [],
      scores: {},
      attendance: [],
      users_map: {},
      org_players_map: {},
      voting_info: null,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/full-details")
        return Promise.resolve(mockFullDetails);
      if (path === "/api/organizations/101/admins") return Promise.resolve([]);
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({ diarista_price: 30 });
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/attendance"]}>
        <Routes>
          <Route
            path="/peladas/:id/attendance"
            element={<AttendanceListPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("stat-tab-pending")).toBeInTheDocument();
    });

    // Check confirmed tab (has 0 players)
    expect(
      screen.getByText(
        /peladas\.attendance\.empty_confirmed|Nenhum jogador confirmado ainda/,
      ),
    ).toBeInTheDocument();

    // Click on pending tab
    fireEvent.click(screen.getByTestId("stat-tab-pending"));
    expect(screen.getByText("Player No MemberType")).toBeInTheDocument();
    // Default member type is diarista
    expect(screen.getByText("DIARISTA")).toBeInTheDocument();
    // Since not mensalista, mark paid button is displayed
    expect(screen.getByTestId("mark-paid-button")).toBeInTheDocument();

    // Check declined tab (has 0 players)
    fireEvent.click(screen.getByTestId("stat-tab-declined"));
    expect(
      screen.getByText(
        /peladas\.attendance\.empty\.declined|Ninguém recusou ainda/,
      ),
    ).toBeInTheDocument();

    // Check waitlist tab (has 0 players)
    fireEvent.click(screen.getByTestId("stat-tab-waitlist"));
    expect(
      screen.getAllByText(
        /peladas\.attendance\.waitlist_empty|Nenhum jogador na fila de espera/,
      ).length,
    ).toBeGreaterThan(0);
  });
});
