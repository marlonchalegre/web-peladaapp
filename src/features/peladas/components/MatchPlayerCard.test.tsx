/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import MatchPlayerCard from "./MatchPlayerCard";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

describe("MatchPlayerCard", () => {
  const defaultProps = {
    player: {
      team_id: "1",
      player_id: "101",
      side: "home" as const,
      is_goalkeeper: false,
    },
    playerName: "Marlon",
    playerData: {
      id: "101",
      user_id: "1",
      organization_id: "1",
      position: "striker",
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

  it("renders empty slot correctly", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          player={{ ...defaultProps.player, isEmpty: true }}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByTestId("player-row-empty")).toBeInTheDocument();
    expect(
      screen.getByText(/peladas\.dashboard\.empty_slot/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument(); // Sub button in empty slot
  });

  it("hides sub button in empty slot for non-admins", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          player={{ ...defaultProps.player, isEmpty: true }}
          isAdmin={false}
        />
      </ThemeContextProvider>,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("hides sub button in empty slot when match is finished", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          player={{ ...defaultProps.player, isEmpty: true }}
          finished={true}
        />
      </ThemeContextProvider>,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders correctly for away side", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          player={{ ...defaultProps.player, side: "away" }}
        />
      </ThemeContextProvider>,
    );
    // Just verify it renders without crash and uses away side logic
    expect(screen.getByTestId("player-row")).toBeInTheDocument();
  });

  it("uses user_position when position is missing", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          playerData={
            {
              ...defaultProps.playerData,
              position: undefined,
              user_position: "Defender",
            } as any
          }
        />
      </ThemeContextProvider>,
    );
    expect(
      screen.getByText(/common\.positions\.defender/i),
    ).toBeInTheDocument();
  });

  it("falls back to 'player' position when both are missing", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          playerData={
            {
              ...defaultProps.playerData,
              position: undefined,
              user_position: undefined,
            } as any
          }
        />
      </ThemeContextProvider>,
    );
    expect(screen.getByText(/common\.positions\.player/i)).toBeInTheDocument();
  });

  it("hides controls when not admin", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard {...defaultProps} isAdmin={false} />
      </ThemeContextProvider>,
    );

    expect(screen.queryByTestId("sub-button")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("stat-goals-increment"),
    ).not.toBeInTheDocument();
  });

  it("hides controls when finished", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard {...defaultProps} finished={true} />
      </ThemeContextProvider>,
    );

    expect(screen.queryByTestId("sub-button")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("stat-goals-increment"),
    ).not.toBeInTheDocument();
  });

  it("triggers onStatChange for goals", async () => {
    const user = userEvent.setup();
    const onStatChange = vi.fn();
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          onStatChange={onStatChange}
          stats={{ goals: 1, assists: 0, ownGoals: 0 }}
        />
      </ThemeContextProvider>,
    );

    await user.click(screen.getByTestId("stat-goals-increment"));
    expect(onStatChange).toHaveBeenCalledWith("goal", 1, "home");

    await user.click(screen.getByTestId("stat-goals-decrement"));
    expect(onStatChange).toHaveBeenCalledWith("goal", -1, "home");
  });

  it("triggers onStatChange for assists", async () => {
    const user = userEvent.setup();
    const onStatChange = vi.fn();
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          onStatChange={onStatChange}
          stats={{ goals: 0, assists: 1, ownGoals: 0 }}
        />
      </ThemeContextProvider>,
    );

    await user.click(screen.getByTestId("stat-assists-increment"));
    expect(onStatChange).toHaveBeenCalledWith("assist", 1, "home");

    await user.click(screen.getByTestId("stat-assists-decrement"));
    expect(onStatChange).toHaveBeenCalledWith("assist", -1, "home");
  });

  it("triggers onStatChange for own goals", async () => {
    const user = userEvent.setup();
    const onStatChange = vi.fn();
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          onStatChange={onStatChange}
          stats={{ goals: 0, assists: 0, ownGoals: 1 }}
        />
      </ThemeContextProvider>,
    );

    await user.click(screen.getByTestId("stat-own-goals-increment"));
    expect(onStatChange).toHaveBeenCalledWith("own_goal", 1, "home");

    await user.click(screen.getByTestId("stat-own-goals-decrement"));
    expect(onStatChange).toHaveBeenCalledWith("own_goal", -1, "home");
  });

  it("disables decrement buttons when stats are zero", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          stats={{ goals: 0, assists: 0, ownGoals: 0 }}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByTestId("stat-goals-decrement")).toBeDisabled();
    expect(screen.getByTestId("stat-assists-decrement")).toBeDisabled();
    expect(screen.getByTestId("stat-own-goals-decrement")).toBeDisabled();
  });

  it("triggers onSubClick when sub button is clicked", async () => {
    const user = userEvent.setup();
    const onSubClick = vi.fn();
    render(
      <ThemeContextProvider>
        <MatchPlayerCard {...defaultProps} onSubClick={onSubClick} />
      </ThemeContextProvider>,
    );

    await user.click(screen.getByTestId("sub-button"));
    expect(onSubClick).toHaveBeenCalled();
  });

  it("renders colored backgrounds for stats when not in control mode", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          isAdmin={false}
          stats={{ goals: 1, assists: 1, ownGoals: 1 }}
        />
      </ThemeContextProvider>,
    );

    // Verify the stats are shown in circles (no controls)
    // We can check the test-ids of values
    expect(screen.getByTestId("stat-goals-value")).toBeInTheDocument();
    expect(screen.getByTestId("stat-assists-value")).toBeInTheDocument();
    expect(screen.getByTestId("stat-own-goals-value")).toBeInTheDocument();
  });
});
