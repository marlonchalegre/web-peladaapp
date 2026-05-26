import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
  within,
} from "@testing-library/react";
import PeladaMatchesPage from "./PeladaMatchesPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../../../shared/api/client";
import { useAuth } from "../../../app/providers/AuthContext";
import type { Match } from "../../../shared/api/endpoints";
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
    onResetMatch,
    onOpenResetConfirm,
    onStartMatch,
    onPauseMatch,
    recordEvent,
    deleteEventAndRefresh,
    adjustScore,
    replacePlayerOnTeam,
    addPlayerToTeam,
  }: any) => (
    <div data-testid="active-match-dashboard">
      <span data-testid="current-match-id">{match.id}</span>
      <span data-testid="finished-status">
        {finished ? "finished" : "running"}
      </span>
      <span data-testid="is-admin">{isAdmin ? "true" : "false"}</span>
      <button data-testid="end-match-btn" onClick={onEndMatch}>
        End Match
      </button>
      <button data-testid="reset-match-btn" onClick={() => onOpenResetConfirm("match")}>
        Reset Match
      </button>
      <button data-testid="reset-session-btn" onClick={() => onOpenResetConfirm("session")}>
        Reset Session
      </button>
      <button data-testid="select-match-10" onClick={() => onSelectMatch("10")}>
        Select Match 10
      </button>
      <button data-testid="select-match-11" onClick={() => onSelectMatch("11")}>
        Select Match 11
      </button>
      <button data-testid="start-match-btn" onClick={() => onStartMatch(match.id)}>
        Start Match
      </button>
      <button data-testid="pause-match-btn" onClick={() => onPauseMatch(match.id)}>
        Pause Match
      </button>
      <button data-testid="record-event-btn" onClick={() => recordEvent(match.id, "100", "goal")}>
        Record Event
      </button>
      <button data-testid="delete-event-btn" onClick={() => deleteEventAndRefresh(match.id, "100", "goal")}>
        Delete Event
      </button>
      <button data-testid="adjust-score-btn" onClick={() => adjustScore(match.id, "home", 1)}>
        Adjust Score
      </button>
      <button data-testid="replace-player-btn" onClick={() => replacePlayerOnTeam("1", "100", "101")}>
        Replace Player
      </button>
      <button data-testid="add-player-btn" onClick={() => addPlayerToTeam("1", "101")}>
        Add Player
      </button>
      <pre data-testid="stats-map">{JSON.stringify(statsMap)}</pre>
    </div>
  ),
}));

vi.mock("../components/MatchReportSummary", () => ({
  default: ({ open, match, onClose }: any) =>
    open ? (
      <div data-testid="match-summary">
        Summary for Match {match?.sequence}
        <button data-testid="close-summary-btn" onClick={onClose}>Close Summary</button>
      </div>
    ) : null,
}));

vi.mock("../components/GlobalSessionTimer", () => ({
  default: () => <div data-testid="global-timer">Timer</div>,
}));

describe("PeladaMatchesPage", () => {
  const mockDashboardData = {
    pelada: {
      id: "1",
      organization_id: "101",
      organization_name: "Test Org",
      status: "running",
      players_per_team: 5,
    },
    matches: [
      {
        id: "10",
        pelada_id: "1",
        sequence: 1,
        status: "finished",
        home_team_id: "1",
        away_team_id: "2",
        home_score: 1,
        away_score: 0,
      },
      {
        id: "11",
        pelada_id: "1",
        sequence: 2,
        status: "scheduled",
        home_team_id: "1",
        away_team_id: "3",
        home_score: 0,
        away_score: 0,
      },
    ],
    teams: [
      { id: "1", name: "Time 1" },
      { id: "2", name: "Time 2" },
      { id: "3", name: "Time 3" },
    ],
    users: [{ id: "1", name: "Player 1" }],
    organization_players: [{ id: "100", user_id: "1", organization_id: "101" }],
    match_events: [
      {
        id: "1",
        match_id: "10",
        player_id: "100",
        event_type: "goal",
        session_time_ms: 1000,
        match_time_ms: 500,
      },
      {
        id: "2",
        match_id: "11",
        player_id: "100",
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
        return Promise.resolve([{ user_id: "1", organization_id: "101" }]);
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
        id: "1",
        name: "Test User",
        email: "test@example.com",
        admin_orgs: ["101"],
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
        return Promise.resolve([{ user_id: "1", organization_id: "101" }]);
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
        return Promise.resolve([{ user_id: "1", organization_id: "101" }]);
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
        return Promise.resolve([{ user_id: "1", organization_id: "101" }]);
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

  it("handles handleClosePelada successfully", async () => {
    (api.post as Mock).mockResolvedValue({});
    renderPage();
    await waitFor(() => screen.getByTestId("active-match-dashboard"));

    // Go to Standings tab
    fireEvent.click(screen.getByText("peladas.panel.standings.title"));

    // Click close pelada
    const closeBtn = screen.getByText("peladas.matches.button.close_pelada");
    fireEvent.click(closeBtn);

    // Confirm dialog
    await waitFor(() =>
      expect(
        screen.getByText("peladas.matches.confirm_close_pelada"),
      ).toBeInTheDocument(),
    );
    const confirmBtn = screen.getByRole("button", { name: "common.confirm" });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(api.post).toHaveBeenCalledWith(expect.stringContaining("/close"));
  });

  it("handles share menu actions correctly", async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });
    window.alert = vi.fn();

    renderPage();
    await waitFor(() => screen.getByTestId("share-dropdown-button"));

    // Open share menu
    fireEvent.click(screen.getByTestId("share-dropdown-button"));

    // Copy Results
    fireEvent.click(screen.getByText("peladas.matches.share_summary"));
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("peladas.matches.summary_copied");
    });

    // Re-open for Announcement
    fireEvent.click(screen.getByTestId("share-dropdown-button"));
    fireEvent.click(screen.getByText("peladas.detail.button.copy_announcement"));
    await waitFor(() => expect(mockClipboard.writeText).toHaveBeenCalled());

    // Re-open for Teams
    fireEvent.click(screen.getByTestId("share-dropdown-button"));
    fireEvent.click(screen.getByText("peladas.detail.button.copy_teams"));
    await waitFor(() => expect(mockClipboard.writeText).toHaveBeenCalled());
  });

  it("switches between tabs and renders content", async () => {
    renderPage();
    await waitFor(() => screen.getByTestId("active-match-dashboard"));

    // Standings
    fireEvent.click(screen.getByText("peladas.panel.standings.title"));
    expect(screen.getByText("peladas.matches.button.close_pelada")).toBeInTheDocument();

    // Stats
    fireEvent.click(screen.getByRole("tab", { name: "peladas.panel.stats.title" }));
    expect(screen.getAllByText("peladas.panel.stats.title").length).toBeGreaterThan(0);

    // Timeline
    fireEvent.click(screen.getByText("peladas.timeline.title"));
    expect(screen.getByText("peladas.timeline.title")).toBeInTheDocument();

    // Dashboard
    fireEvent.click(screen.getByText("Dashboard"));
    expect(screen.getByTestId("active-match-dashboard")).toBeInTheDocument();
  });

  it("handles timer resets correctly", async () => {
    (api.post as Mock).mockResolvedValue({});
    renderPage();
    await waitFor(() => screen.getByTestId("active-match-dashboard"));

    // Reset Match
    fireEvent.click(screen.getByTestId("reset-match-btn"));
    
    const dialog = await screen.findByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", { name: "common.confirm" });
    fireEvent.click(confirmBtn);
    
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(expect.stringContaining("/timer/reset"), {}));
  });

  it("handles data loading error", async () => {
    (api.get as Mock).mockRejectedValue(new Error("Load fail"));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Load fail")).toBeInTheDocument();
    });
  });

  it("covers ActiveMatchDashboard callbacks, MatchReportSummary onClose, and session reset confirmation dialog", async () => {
    (api.post as Mock).mockResolvedValue({});
    (api.put as Mock).mockResolvedValue({});
    (api.delete as Mock).mockResolvedValue({});

    renderPage();
    await waitFor(() => expect(screen.getByTestId("active-match-dashboard")).toBeInTheDocument());

    // 1. Start Match (triggers startPeladaTimer and startMatchTimer)
    fireEvent.click(screen.getByTestId("start-match-btn"));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining("/timer/start"), {});
    });

    // 2. Pause Match
    fireEvent.click(screen.getByTestId("pause-match-btn"));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining("/timer/pause"), {});
    });

    // 3. Record Event
    fireEvent.click(screen.getByTestId("record-event-btn"));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining("/events"), expect.any(Object));
    });

    // 4. Delete Event
    fireEvent.click(screen.getByTestId("delete-event-btn"));
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(expect.stringContaining("/events"), expect.any(Object));
    });

    // 5. Adjust Score
    fireEvent.click(screen.getByTestId("adjust-score-btn"));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(expect.stringContaining("/score"), expect.any(Object));
    });

    // 6. Replace Player
    fireEvent.click(screen.getByTestId("replace-player-btn"));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining("/lineups/replace"), expect.any(Object));
    });

    // 7. Add Player
    fireEvent.click(screen.getByTestId("add-player-btn"));
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining("/lineups"), expect.any(Object));
    });

    // 8. Open reset session confirm dialog and confirm it
    fireEvent.click(screen.getByTestId("reset-session-btn"));
    await waitFor(() => expect(screen.getAllByText("common.confirm")[0]).toBeInTheDocument());
    const confirmBtn = screen.getAllByRole("button", { name: "common.confirm" })[0];
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining("/timer/reset"), {});
    });

    // 9. Close MatchReportSummary
    // End match to open it
    (api.put as Mock).mockResolvedValueOnce({
      ...mockDashboardData.matches[1],
      status: "finished",
    });
    fireEvent.click(screen.getByTestId("select-match-11"));
    fireEvent.click(screen.getByTestId("end-match-btn"));
    const endConfirmBtn = screen.getAllByRole("button", { name: "common.confirm" })[0];
    await act(async () => {
      fireEvent.click(endConfirmBtn);
    });

    await waitFor(() => expect(screen.getByTestId("match-summary")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("close-summary-btn"));
    await waitFor(() => expect(screen.queryByTestId("match-summary")).not.toBeInTheDocument());
  });
});
