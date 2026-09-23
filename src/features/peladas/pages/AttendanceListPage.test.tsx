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

describe("AttendanceListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(screen.getByText("VAGAS")).toBeInTheDocument();
      expect(screen.getByText("DIÁRIAS DESTA PELADA")).toBeInTheDocument();
      expect(screen.getByText("SUA RESPOSTA")).toBeInTheDocument();
      expect(screen.getByText("VOU JOGAR")).toBeInTheDocument();
      expect(screen.getAllByText("FILA DE ESPERA").length).toBeGreaterThan(0);
      expect(screen.getByText("NÃO VOU")).toBeInTheDocument();
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

    const removeBtn = screen.getByTitle("Remover da lista");
    fireEvent.click(removeBtn);

    expect(api.post).toHaveBeenCalledWith(
      "/api/peladas/1/attendance",
      expect.objectContaining({
        status: "declined",
        player_id: "10",
      }),
    );

    const promoteBtn = screen.getByTitle("Promover para confirmados");
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
});
