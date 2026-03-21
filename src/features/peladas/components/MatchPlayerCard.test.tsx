import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MatchPlayerCard from "./MatchPlayerCard";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

describe("MatchPlayerCard", () => {
  const defaultProps = {
    player: {
      team_id: 1,
      player_id: 101,
      side: "home" as const,
      is_goalkeeper: false,
    },
    playerName: "Marlon",
    playerData: {
      id: 101,
      user_id: 1,
      organization_id: 1,
      position_id: 4, // Striker
    },
    stats: { goals: 0, assists: 0, ownGoals: 0 },
    finished: false,
    isAdmin: true,
    onStatChange: vi.fn(),
    onSubClick: vi.fn(),
  };

  it("renders player name and default position", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard {...defaultProps} />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("Marlon")).toBeInTheDocument();
    // common.positions.striker
    expect(screen.getByText(/common\.positions\.striker/i)).toBeInTheDocument();
  });

  it("prioritizes is_goalkeeper status over default position", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          player={{ ...defaultProps.player, is_goalkeeper: true }}
        />
      </ThemeContextProvider>,
    );

    // Should show common.positions.goalkeeper
    expect(
      screen.getByText(/common\.positions\.goalkeeper/i),
    ).toBeInTheDocument();
  });

  it("renders own goals with different color if > 0", () => {
    const { rerender } = render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          stats={{ goals: 0, assists: 0, ownGoals: 0 }}
        />
      </ThemeContextProvider>,
    );

    const contraLabel = screen.getByText(/common\.own_goals_short/i);
    // MUI text.secondary in default theme is rgb(100, 116, 139) or similar
    // Let's just check it HAS a style color and then it CHANGES.
    expect(contraLabel).toHaveStyle("color: rgb(100, 116, 139)");

    rerender(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          stats={{ goals: 0, assists: 0, ownGoals: 1 }}
        />
      </ThemeContextProvider>,
    );

    const contraLabelUpdated = screen.getByText(/common\.own_goals_short/i);
    expect(contraLabelUpdated).not.toHaveStyle("color: rgb(100, 116, 139)");
  });
});
