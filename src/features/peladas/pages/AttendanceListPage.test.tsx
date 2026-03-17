import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
      id: 1,
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
        id: 1,
        organization_id: 101,
        organization_name: "Test Org",
        status: "attendance",
      },
      available_players: [
        {
          id: 10,
          user_id: 1,
          attendance_status: "confirmed",
          user: { id: 1, name: "Confirmed Player", position: "Striker" },
        },
        {
          id: 11,
          user_id: 2,
          attendance_status: "waitlist",
          user: { id: 2, name: "Waitlist Player", position: "Goalkeeper" },
        },
        {
          id: 12,
          user_id: 3,
          attendance_status: "pending",
          user: { id: 3, name: "Pending Player", position: "Defender" },
        },
        {
          id: 13,
          user_id: 4,
          attendance_status: "declined",
          user: { id: 4, name: "Declined Player", position: "Midfielder" },
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
});
