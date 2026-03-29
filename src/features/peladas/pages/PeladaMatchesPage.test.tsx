import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import PeladaMatchesPage from "./PeladaMatchesPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../../../shared/api/client";
import { useAuth } from "../../../app/providers/AuthContext";
import { type Match } from "../../../shared/api/endpoints";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

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

// Mock components to simplify tests
vi.mock("../components/ActiveMatchDashboard", () => ({
  default: ({
    match,
    statsMap,
    finished,
    isAdmin,
    onEndMatch,
    onSelectMatch,
  }: {
    match: Match;
    statsMap: Record<
      number,
      { goals: number; assists: number; ownGoals: number }
    >;
    finished: boolean;
    isAdmin: boolean;
    onEndMatch: () => void;
    onSelectMatch: (id: number) => void;
    matches: Match[];
  }) => (
    <div data-testid="active-match-dashboard">
      <span data-testid="current-match-id">{match.id}</span>
      <span data-testid="finished-status">
        {finished ? "finished" : "running"}
      </span>
      <span data-testid="is-admin">{isAdmin ? "true" : "false"}</span>
      <button data-testid="end-match-btn" onClick={onEndMatch}>
        End Match
      </button>
      <button data-testid="select-match-10" onClick={() => onSelectMatch(10)}>
        Select Match 10
      </button>
      <button data-testid="select-match-11" onClick={() => onSelectMatch(11)}>
        Select Match 11
      </button>
      <pre data-testid="stats-map">{JSON.stringify(statsMap)}</pre>
    </div>
  ),
}));

vi.mock("../components/MatchReportSummary", () => ({
  default: ({ open, match }: { open: boolean; match: Match | null }) =>
    open ? (
      <div data-testid="match-summary">Summary for Match {match?.sequence}</div>
    ) : null,
}));

vi.mock("../components/GlobalSessionTimer", () => ({
  default: () => <div data-testid="global-timer">Timer</div>,
}));

describe("PeladaMatchesPage", () => {
  const mockDashboardData = {
    pelada: {
      id: 1,
      organization_id: 101,
      organization_name: "Test Org",
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
        status: "scheduled",
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
      {
        id: 1,
        match_id: 10,
        player_id: 100,
        event_type: "goal",
        session_time_ms: 1000,
        match_time_ms: 500,
      },
      {
        id: 2,
        match_id: 11,
        player_id: 100,
        event_type: "assist",
        session_time_ms: 2000,
        match_time_ms: 1000,
      },
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
      if (path === "/api/organizations/101/finance")
        return Promise.resolve({
          mensalista_price: 0,
          diarista_price: 0,
          currency: "BRL",
        });
      return Promise.reject(new Error(`Not found: ${path}`));
    });

    (useAuth as Mock).mockReturnValue({
      user: {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        admin_orgs: [101],
      },
      isAuthenticated: true,
    });
  });

  const renderPage = () => {
    return render(
      <ThemeContextProvider>
        <MemoryRouter initialEntries={["/peladas/1/matches"]}>
          <Routes>
            <Route
              path="/peladas/:id/matches"
              element={<PeladaMatchesPage />}
            />
          </Routes>
        </MemoryRouter>
      </ThemeContextProvider>,
    );
  };

  it("filters statistics correctly for the selected match", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("active-match-dashboard")).toBeInTheDocument();
    });

    // Auto-selects first scheduled (id 11)
    expect(screen.getByTestId("current-match-id").textContent).toBe("11");

    let statsMap = JSON.parse(
      screen.getByTestId("stats-map").textContent || "{}",
    );
    expect(statsMap["100"].goals).toBe(0);
    expect(statsMap["100"].assists).toBe(1);

    // Switch to match 10
    const select10Btn = screen.getByTestId("select-match-10");
    fireEvent.click(select10Btn);

    await waitFor(() => {
      statsMap = JSON.parse(
        screen.getByTestId("stats-map").textContent || "{}",
      );
      expect(statsMap["100"].goals).toBe(1);
      expect(statsMap["100"].assists).toBe(0);
    });
  });

  it("hides 'Close pelada' button from Standings tab when status is 'closed'", async () => {
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

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("active-match-dashboard")).toBeInTheDocument();
    });

    // Switch to Standings tab
    const standingsTab = screen.getByText("peladas.panel.standings.title");
    fireEvent.click(standingsTab);

    expect(
      screen.queryByText("peladas.matches.button.close_pelada"),
    ).not.toBeInTheDocument();
  });

  it("shows 'Close pelada' button in Standings tab when user is an admin", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("active-match-dashboard")).toBeInTheDocument();
    });

    // Switch to Standings tab
    const standingsTab = screen.getByText("peladas.panel.standings.title");
    fireEvent.click(standingsTab);

    expect(
      screen.getByText("peladas.matches.button.close_pelada"),
    ).toBeInTheDocument();
  });

  it("shows 'Vote' button in header when status is 'voting'", async () => {
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

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("peladas.detail.button.vote"),
      ).toBeInTheDocument();
    });
  });

  it("shows 'View Results' button in header when status is 'closed'", async () => {
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

    renderPage();

    await waitFor(() => screen.getByTestId("share-dropdown-button"));
    fireEvent.click(screen.getByTestId("share-dropdown-button"));

    await waitFor(() => {
      expect(
        screen.getByText("peladas.matches.share_summary"),
      ).toBeInTheDocument();
    });
  });

  it("shows match summary when end match is clicked", async () => {
    (api.put as Mock).mockResolvedValue({
      ...mockDashboardData.matches[1],
      status: "finished",
    });

    renderPage();

    await waitFor(() => screen.getByTestId("active-match-dashboard"));

    // Switch to Match 11 (scheduled)
    fireEvent.click(screen.getByTestId("select-match-11"));

    // Click end match button
    const endBtn = screen.getByTestId("end-match-btn");
    fireEvent.click(endBtn);

    // Should show the pretty confirm dialog
    await waitFor(() => {
      expect(
        screen.getByText("peladas.matches.confirm_end_match"),
      ).toBeInTheDocument();
    });

    // Confirm it
    const confirmBtn = screen.getByRole("button", { name: "common.confirm" });

    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("match-summary")).toBeInTheDocument();
        // Match 11 is sequence 2
        expect(screen.getByText(/Summary for Match 2/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
