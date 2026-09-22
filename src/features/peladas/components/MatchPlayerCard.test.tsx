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
    onSubClick: vi.fn(),
  };

  it("renders player name and short position code", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard {...defaultProps} />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("Marlon")).toBeInTheDocument();
    expect(screen.getByText("ATA")).toBeInTheDocument();
  });

  it("prioritizes is_goalkeeper status over player position", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          player={{ ...defaultProps.player, is_goalkeeper: true }}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("GOL")).toBeInTheDocument();
  });

  it("maps defender and midfielder to short codes", () => {
    const { rerender } = render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          playerData={{ ...defaultProps.playerData, position: "defender" }}
        />
      </ThemeContextProvider>,
    );
    expect(screen.getByText("ZAG")).toBeInTheDocument();

    rerender(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          playerData={{ ...defaultProps.playerData, position: "midfielder" }}
        />
      </ThemeContextProvider>,
    );
    expect(screen.getByText("MEI")).toBeInTheDocument();
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
    expect(screen.getByText("ZAG")).toBeInTheDocument();
  });

  it("falls back to generic position label when unknown", () => {
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

  it("renders empty slot with add button for admins", () => {
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
    expect(screen.getByTestId("add-player-button")).toBeInTheDocument();
  });

  it("hides add button in empty slot for non-admins", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          player={{ ...defaultProps.player, isEmpty: true }}
          isAdmin={false}
        />
      </ThemeContextProvider>,
    );

    expect(screen.queryByTestId("add-player-button")).not.toBeInTheDocument();
  });

  it("hides add button in empty slot when match is finished", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          player={{ ...defaultProps.player, isEmpty: true }}
          finished={true}
        />
      </ThemeContextProvider>,
    );

    expect(screen.queryByTestId("add-player-button")).not.toBeInTheDocument();
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
    expect(screen.getByTestId("player-row-Marlon")).toBeInTheDocument();
  });

  it("hides swap button when not admin", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard {...defaultProps} isAdmin={false} />
      </ThemeContextProvider>,
    );

    expect(screen.queryByTestId("sub-button")).not.toBeInTheDocument();
  });

  it("hides swap button when finished", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard {...defaultProps} finished={true} />
      </ThemeContextProvider>,
    );

    expect(screen.queryByTestId("sub-button")).not.toBeInTheDocument();
  });

  it("triggers onSubClick when swap button is clicked", async () => {
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

  it("mobile variant shows swap button with label", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard {...defaultProps} />
      </ThemeContextProvider>,
    );

    const swap = screen.getByTestId("sub-button");
    expect(swap).toHaveTextContent(
      /peladas\.dashboard\.live_state\.swap_button/i,
    );
  });

  it("desktop variant shows live stat and icon-only swap", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          variant="desktop"
          stats={{ goals: 1, assists: 2, ownGoals: 0 }}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("1G")).toBeInTheDocument();
    expect(screen.getByText("2A")).toBeInTheDocument();
    const swap = screen.getByTestId("sub-button");
    expect(swap.tagName).toBe("BUTTON");
    expect(swap).not.toHaveTextContent(/swap_button/i);
  });

  it("renders own goals when player has own goals", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard
          {...defaultProps}
          variant="desktop"
          stats={{ goals: 0, assists: 0, ownGoals: 1 }}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("1GC")).toBeInTheDocument();
  });

  it("renders position label next to player name", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard {...defaultProps} />
      </ThemeContextProvider>,
    );

    const posLabel = screen.getByTestId("player-position-label");
    expect(posLabel).toHaveTextContent("ATA");
    expect(posLabel.parentElement).toContainElement(
      screen.getByTestId("player-name"),
    );
  });

  it("desktop variant hides stat when player has no goals, assists, or own goals", () => {
    render(
      <ThemeContextProvider>
        <MatchPlayerCard {...defaultProps} variant="desktop" />
      </ThemeContextProvider>,
    );

    expect(
      screen.queryByTestId("player-stats-container"),
    ).not.toBeInTheDocument();
  });
});
