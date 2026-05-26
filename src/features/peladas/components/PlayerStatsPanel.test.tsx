import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PlayerStatsPanel, { type PlayerStatRow } from "./PlayerStatsPanel";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock SecureAvatar to avoid network requests or complex image renderings
vi.mock("../../../shared/components/SecureAvatar", () => ({
  SecureAvatar: ({ fallbackText }: { fallbackText?: string }) => (
    <div data-testid="avatar">{fallbackText}</div>
  ),
}));

describe("PlayerStatsPanel", () => {
  let mockStats: PlayerStatRow[];
  let onToggleSort: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onToggleSort = vi.fn();
    mockStats = [
      {
        playerId: "p1",
        userId: "u1",
        name: "Alice",
        goals: 3,
        assists: 1,
        ownGoals: 0,
        matchesPlayed: 4,
      },
      {
        playerId: "p2",
        userId: "u2",
        name: "Bob",
        goals: 3,
        assists: 5,
        ownGoals: 1,
        matchesPlayed: 4,
      },
      {
        playerId: "p3",
        userId: "u3",
        name: "Charlie",
        goals: 0,
        assists: 0,
        ownGoals: 0,
        matchesPlayed: 2,
      },
    ];
  });

  const renderComponent = (props = {}) => {
    return render(
      <ThemeContextProvider>
        <PlayerStatsPanel
          playerStats={mockStats}
          onToggleSort={onToggleSort}
          showHighlights={true}
          {...props}
        />
      </ThemeContextProvider>,
    );
  };

  it("renders player stats in the table", () => {
    renderComponent({ showHighlights: false });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();

    // Alice stats in table
    expect(screen.getAllByText("3")).toHaveLength(2); // Alice goals & Bob goals
    expect(screen.getAllByText("5").length).toBeGreaterThan(0); // Bob assists
    expect(screen.getAllByText("1").length).toBeGreaterThan(0); // Bob ownGoals
  });

  it("renders highlight cards for top scorers and assists when there are non-zero stats", () => {
    renderComponent({ showHighlights: true });

    expect(
      screen.getByText("peladas.dashboard.summary.highlights"),
    ).toBeInTheDocument();

    // Top scorer should have Alice and Bob (both have 3 goals)
    // Bob should also be highlighted as top assists (5 assists)
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
  });

  it("does not render summary highlights if goals and assists are all 0", () => {
    const zeroStats = [
      { playerId: "p1", name: "Alice", goals: 0, assists: 0, ownGoals: 0 },
    ];
    renderComponent({ playerStats: zeroStats, showHighlights: true });

    expect(
      screen.queryByText("peladas.dashboard.summary.highlights"),
    ).not.toBeInTheDocument();
  });

  it("triggers onToggleSort when goals or assists headers are clicked", () => {
    renderComponent({ showHighlights: false });

    const sortButtons = screen.getAllByTestId("SwapVertIcon");
    expect(sortButtons).toHaveLength(2);

    // Click sort goals
    fireEvent.click(sortButtons[0]);
    expect(onToggleSort).toHaveBeenCalledWith("goals");

    // Click sort assists
    fireEvent.click(sortButtons[1]);
    expect(onToggleSort).toHaveBeenCalledWith("assists");
  });
});
