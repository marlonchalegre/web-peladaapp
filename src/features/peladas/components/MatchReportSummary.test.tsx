import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MatchReportSummary from "./MatchReportSummary";
import { ThemeProvider, createTheme } from "@mui/material";
import type { Match, MatchEvent } from "../../../shared/api/endpoints";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === "peladas.dashboard.summary.title")
        return `Match #${params?.seq} Summary`;
      if (key === "peladas.dashboard.summary.next_match_desc")
        return `Match #${params?.seq} is ready`;
      return key;
    },
  }),
}));

const theme = createTheme({
  palette: {
    home: { main: "#1976d2" },
    away: { main: "#9c27b0" },
  },
});

const mockMatch: Match = {
  id: 1,
  pelada_id: 1,
  sequence: 4,
  home_team_id: 10,
  away_team_id: 20,
  home_score: 4,
  away_score: 3,
  status: "finished",
};

const mockEvents: MatchEvent[] = [
  { id: 1, match_id: 1, player_id: 101, event_type: "goal" },
  { id: 2, match_id: 1, player_id: 101, event_type: "goal" },
  { id: 3, match_id: 1, player_id: 102, event_type: "assist" },
  { id: 4, match_id: 1, player_id: 201, event_type: "own_goal" },
];

const mockUserIdToName = {
  1: "Player One",
  2: "Player Two",
  3: "Opponent One",
};
const mockOrgPlayerIdToUserId = { 101: 1, 102: 2, 201: 3 };
const mockOrgPlayerIdToTeamId = { 101: 10, 102: 10, 201: 20 };
const mockTeamNameById = { 10: "Time 4", 20: "Time 2" };

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe("MatchReportSummary", () => {
  it("renders match results correctly", () => {
    renderWithTheme(
      <MatchReportSummary
        open={true}
        onClose={vi.fn()}
        match={mockMatch}
        homeTeamName="Time 4"
        awayTeamName="Time 2"
        events={mockEvents}
        userIdToName={mockUserIdToName}
        orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
        orgPlayerIdToTeamId={mockOrgPlayerIdToTeamId}
        teamNameById={mockTeamNameById}
      />,
    );

    expect(screen.getByText("Match #4 Summary")).toBeInTheDocument();
    expect(screen.getByText("4 - 3")).toBeInTheDocument();
    expect(screen.getByText("Time 4")).toBeInTheDocument();
    expect(screen.getByText("Time 2")).toBeInTheDocument();
  });

  it("groups highlights correctly (x2 for double goals)", () => {
    renderWithTheme(
      <MatchReportSummary
        open={true}
        onClose={vi.fn()}
        match={mockMatch}
        homeTeamName="Time 4"
        awayTeamName="Time 2"
        events={mockEvents}
        userIdToName={mockUserIdToName}
        orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
        orgPlayerIdToTeamId={mockOrgPlayerIdToTeamId}
        teamNameById={mockTeamNameById}
      />,
    );

    expect(screen.getByText("Player One")).toBeInTheDocument();
    expect(screen.getByText("x2")).toBeInTheDocument(); // Goals for Player One
    expect(screen.getByText("Player Two")).toBeInTheDocument();
    expect(screen.getByText("Opponent One")).toBeInTheDocument();
  });

  it("shows next match preview when provided", () => {
    const nextMatch: Match = {
      ...mockMatch,
      id: 2,
      sequence: 5,
      home_team_id: 20,
      away_team_id: 30,
      home_score: 0,
      away_score: 0,
    };
    const extendedTeamNames = { ...mockTeamNameById, 30: "Time 3" };

    renderWithTheme(
      <MatchReportSummary
        open={true}
        onClose={vi.fn()}
        match={mockMatch}
        homeTeamName="Time 4"
        awayTeamName="Time 2"
        events={mockEvents}
        userIdToName={mockUserIdToName}
        orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
        orgPlayerIdToTeamId={mockOrgPlayerIdToTeamId}
        teamNameById={extendedTeamNames}
        nextMatch={nextMatch}
        onProceedToNext={vi.fn()}
      />,
    );

    expect(
      screen.getByText("peladas.dashboard.summary.next_up"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("next-home-team")).toHaveTextContent("Time 2");
    expect(screen.getByTestId("next-away-team")).toHaveTextContent("Time 3");
    expect(screen.getByText("Match #5 is ready")).toBeInTheDocument();
  });

  it("calls onProceedToNext when next button is clicked", () => {
    const nextMatch: Match = { ...mockMatch, id: 2, sequence: 5 };
    const onProceed = vi.fn();

    renderWithTheme(
      <MatchReportSummary
        open={true}
        onClose={vi.fn()}
        match={mockMatch}
        homeTeamName="Time 4"
        awayTeamName="Time 2"
        events={mockEvents}
        userIdToName={mockUserIdToName}
        orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
        orgPlayerIdToTeamId={mockOrgPlayerIdToTeamId}
        teamNameById={mockTeamNameById}
        nextMatch={nextMatch}
        onProceedToNext={onProceed}
      />,
    );

    const nextBtn = screen.getByText("peladas.dashboard.summary.go_to_next");
    fireEvent.click(nextBtn);
    expect(onProceed).toHaveBeenCalled();
  });
});
