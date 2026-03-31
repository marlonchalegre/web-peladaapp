import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SwapPlayerDialog from "./SwapPlayerDialog";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import type { Player, User } from "../../../shared/api/endpoints";

const mockUser = (id: number, name: string, position: string): User => ({
  id,
  name,
  username: name.toLowerCase(),
  email: `${name.toLowerCase()}@example.com`,
  position,
});

const mockPlayer = (id: number, user: User): Player & { user: User } => ({
  id,
  user_id: user.id,
  organization_id: 1,
  member_type: "mensalista",
  grade: 8,
  user,
});

describe("SwapPlayerDialog", () => {
  const targetPlayers = [
    mockPlayer(1, mockUser(101, "Defender One", "Defender")),
    mockPlayer(2, mockUser(102, "Striker One", "Striker")),
    mockPlayer(3, mockUser(103, "GK One", "Goalkeeper")),
  ];

  const incomingPlayer = mockPlayer(4, mockUser(104, "Striker Two", "Striker"));

  it("renders sorted players by position (GK first)", () => {
    render(
      <ThemeContextProvider>
        <SwapPlayerDialog
          open={true}
          onClose={() => {}}
          incomingPlayer={incomingPlayer}
          targetTeamName="Team A"
          targetTeamPlayers={targetPlayers}
          onSwap={() => {}}
        />
      </ThemeContextProvider>,
    );

    const playerNames = screen.getAllByRole("button").map((b) => b.textContent);
    // Role button includes Cancel at the end
    expect(playerNames[0]).toContain("GK One");
    expect(playerNames[1]).toContain("Defender One");
    expect(playerNames[2]).toContain("Striker One");
  });

  it("calls onSwap with correct player ID when clicked", () => {
    const onSwap = vi.fn();
    render(
      <ThemeContextProvider>
        <SwapPlayerDialog
          open={true}
          onClose={() => {}}
          incomingPlayer={incomingPlayer}
          targetTeamName="Team A"
          targetTeamPlayers={targetPlayers}
          onSwap={onSwap}
        />
      </ThemeContextProvider>,
    );

    fireEvent.click(screen.getByText("Defender One"));
    expect(onSwap).toHaveBeenCalledWith(1);
  });

  it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(
      <ThemeContextProvider>
        <SwapPlayerDialog
          open={true}
          onClose={onClose}
          incomingPlayer={incomingPlayer}
          targetTeamName="Team A"
          targetTeamPlayers={targetPlayers}
          onSwap={() => {}}
        />
      </ThemeContextProvider>,
    );

    fireEvent.click(screen.getByText("common.cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
