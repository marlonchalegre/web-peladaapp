import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PeladaMatchesPage from "./PeladaMatchesPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../../../shared/api/client";

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
  useAuth: () => ({
    user: { id: 1, name: "Test User", email: "test@example.com" },
    isAuthenticated: true,
  }),
}));

// Mock ActiveMatchDashboard to verify props
vi.mock("../components/ActiveMatchDashboard", () => ({
  default: ({
    statsMap,
    finished,
  }: {
    statsMap: Record<number, { goals: number; assists: number }>;
    finished: boolean;
  }) => (
    <div data-testid="active-match-dashboard">
      <span data-testid="finished-status">
        {finished ? "finished" : "running"}
      </span>
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
      return Promise.reject(new Error("Not found"));
    });
  });

  it("filters statistics correctly for the selected match", async () => {
    render(
      <MemoryRouter initialEntries={["/peladas/1/matches"]}>
        <Routes>
          <Route path="/peladas/:id/matches" element={<PeladaMatchesPage />} />
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
    match11Item.click();

    await waitFor(() => {
      const statsMap11 = JSON.parse(
        screen.getByTestId("stats-map").textContent || "{}",
      );
      expect(statsMap11["100"].goals).toBe(0);
      expect(statsMap11["100"].assists).toBe(1);
    });
  });

  it("hides 'Close pelada' button when status is 'voting'", async () => {
    const votingData = {
      ...mockDashboardData,
      pelada: { ...mockDashboardData.pelada, status: "voting" },
    };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas/1/dashboard-data")
        return Promise.resolve(votingData);
      return Promise.reject(new Error("Not found"));
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
});
