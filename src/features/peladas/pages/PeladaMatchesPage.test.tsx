import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import PeladaMatchesPage from "./PeladaMatchesPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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

// Mock ActiveMatchDashboard to verify props
vi.mock("../components/ActiveMatchDashboard", () => ({
  default: ({
    statsMap,
    finished,
    isAdmin,
  }: {
    statsMap: Record<number, { goals: number; assists: number }>;
    finished: boolean;
    isAdmin: boolean;
  }) => (
    <div data-testid="active-match-dashboard">
      <span data-testid="finished-status">
        {finished ? "finished" : "running"}
      </span>
      <span data-testid="is-admin">{isAdmin ? "true" : "false"}</span>
      <pre data-testid="stats-map">{JSON.stringify(statsMap)}</pre>
    </div>
  ),
}));

describe("PeladaMatchesPage", () => {
  const mockDashboardData = {
    pelada: {
      id: 1,
      organization_id: 101,
      status: "running",
      players_per_team: 5,
    },
    matches: [
      {
        id: 10,
        pelada_id: 1,
        sequence: 1,
        status: "finished",
        home_team_id: 1,
        away_team_id: 2,
        home_score: 1,
        away_score: 0,
      },
      {
        id: 11,
        pelada_id: 1,
        sequence: 2,
        status: "running",
        home_team_id: 1,
        away_team_id: 3,
        home_score: 0,
        away_score: 0,
      },
    ],
    teams: [
      { id: 1, name: "Time 1" },
      { id: 2, name: "Time 2" },
      { id: 3, name: "Time 3" },
    ],
    users: [{ id: 1, name: "Player 1" }],
    organization_players: [{ id: 100, user_id: 1, organization_id: 101 }],
    match_events: [
      { id: 1, match_id: 10, player_id: 100, event_type: "goal" },
      { id: 2, match_id: 11, player_id: 100, event_type: "assist" },
    ],
    player_stats: [],
    team_players_map: {},
    match_lineups_map: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/dashboard-data")
        return Promise.resolve(mockDashboardData);
      if (path === "/api/organizations/101/admins")
        return Promise.resolve([{ user_id: 1, organization_id: 101 }]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    (useAuth as Mock).mockReturnValue({
      user: {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        admin_orgs: [101], // Mock as admin of the org
      },
      isAuthenticated: true,
    });
  });

  it("filters statistics correctly for the selected match", async () => {
    render(
      <MemoryRouter initialEntries={["/peladas/1/matches"]}>
        <Routes>
          <Route path="/peladas/:id/matches" element={<PeladaMatchesPage />} />
          <Route path="*" element={<div />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("active-match-dashboard")).toBeInTheDocument();
    });

    // By default, first match (id: 10) should be selected
    const statsMap10 = JSON.parse(
      screen.getByTestId("stats-map").textContent || "{}",
    );
    expect(statsMap10["100"].goals).toBe(1);
    expect(statsMap10["100"].assists).toBe(0);

    // Click second match (id: 11)
    const match11Item = screen.getAllByText(
      "peladas.matches.history_item_title",
    )[1];
    fireEvent.click(match11Item);

    await waitFor(() => {
      const statsMap11 = JSON.parse(
        screen.getByTestId("stats-map").textContent || "{}",
      );
      expect(statsMap11["100"].goals).toBe(0);
      expect(statsMap11["100"].assists).toBe(1);
    });
  });

  it("hides 'Close pelada' button when status is 'closed'", async () => {
    const closedData = {
      ...mockDashboardData,
      pelada: { ...mockDashboardData.pelada, status: "closed" },
    };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/dashboard-data")
        return Promise.resolve(closedData);
      if (path === "/api/organizations/101/admins")
        return Promise.resolve([{ user_id: 1, organization_id: 101 }]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/matches"]}>
        <Routes>
          <Route path="/peladas/:id/matches" element={<PeladaMatchesPage />} />
          <Route path="*" element={<div />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.queryByText("peladas.matches.button.close_pelada"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("peladas.matches.status.closed"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("finished-status").textContent).toBe(
        "finished",
      );
    });
  });

  it("hides 'Close pelada' button when user is not an admin", async () => {
    (useAuth as Mock).mockReturnValue({
      user: {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        admin_orgs: [], // Not an admin
      },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/matches"]}>
        <Routes>
          <Route path="/peladas/:id/matches" element={<PeladaMatchesPage />} />
          <Route path="*" element={<div />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.queryByText("peladas.matches.button.close_pelada"),
      ).not.toBeInTheDocument();
    });
  });

  it("shows 'Close pelada' button when user is an admin", async () => {
    render(
      <MemoryRouter initialEntries={["/peladas/1/matches"]}>
        <Routes>
          <Route path="/peladas/:id/matches" element={<PeladaMatchesPage />} />
          <Route path="*" element={<div />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("peladas.matches.button.close_pelada"),
      ).toBeInTheDocument();
    });
  });

  it("shows 'Vote' button when status is 'voting'", async () => {
    const votingData = {
      ...mockDashboardData,
      pelada: { ...mockDashboardData.pelada, status: "voting" },
    };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/dashboard-data")
        return Promise.resolve(votingData);
      if (path === "/api/organizations/101/admins")
        return Promise.resolve([{ user_id: 1, organization_id: 101 }]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/matches"]}>
        <Routes>
          <Route path="/peladas/:id/matches" element={<PeladaMatchesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("peladas.detail.button.vote")).toBeInTheDocument();
    });
  });

  it("shows 'View Results' button when status is 'closed'", async () => {
    const closedData = {
      ...mockDashboardData,
      pelada: { ...mockDashboardData.pelada, status: "closed" },
    };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/dashboard-data")
        return Promise.resolve(closedData);
      if (path === "/api/organizations/101/admins")
        return Promise.resolve([{ user_id: 1, organization_id: 101 }]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    render(
      <MemoryRouter initialEntries={["/peladas/1/matches"]}>
        <Routes>
          <Route path="/peladas/:id/matches" element={<PeladaMatchesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("peladas.detail.button.view_results"),
      ).toBeInTheDocument();
    });
  });
});
