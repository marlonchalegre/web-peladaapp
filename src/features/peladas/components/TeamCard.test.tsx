import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TeamCard from "./TeamCard";
import type { Player, Team, User } from "../../../shared/api/endpoints";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { score?: string | number }) => {
      if (key === "peladas.team_card.average") return `AVG: ${params?.score}`;
      if (key.startsWith("common.positions.")) return key.split(".").pop();
      return key;
    },
  }),
}));

describe("TeamCard", () => {
  const mockTeam: Team = { id: 1, pelada_id: 1, name: "Team Alpha" };
  const mockPlayers: (Player & { user: User; displayScore?: string })[] = [
    {
      id: 101,
      user_id: 1,
      organization_id: 1,
      user: {
        id: 1,
        name: "Player 1",
        username: "player1",
        email: "p1@e.com",
        position: "Goalkeeper",
      },
      displayScore: "8.5",
    },
    {
      id: 102,
      user_id: 2,
      organization_id: 1,
      user: {
        id: 2,
        name: "Player 2",
        username: "player2",
        email: "p2@e.com",
        position: "Striker",
      },
      displayScore: "7.0",
    },
  ];

  it("renders team name and average score", () => {
    render(
      <ThemeContextProvider>
        <TeamCard
          team={mockTeam}
          players={mockPlayers}
          averageScore={7.75}
          onDelete={() => {}}
          onDrop={async () => {}}
          onDragStartPlayer={() => {}}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("Team Alpha")).toBeInTheDocument();
    expect(screen.getByText("AVG: 7.8")).toBeInTheDocument();
  });

  it("renders players with their names and positions in order", () => {
    render(
      <ThemeContextProvider>
        <TeamCard
          team={mockTeam}
          players={mockPlayers}
          averageScore={7.75}
          onDelete={() => {}}
          onDrop={async () => {}}
          onDragStartPlayer={() => {}}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("goalkeeper")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    expect(screen.getByText("striker")).toBeInTheDocument();

    // Verify ordering (defense to attack)
    const playerElements = screen.getAllByText(/Player [12]/);
    expect(playerElements[0]).toHaveTextContent("Player 1"); // GK
    expect(playerElements[1]).toHaveTextContent("Player 2"); // Striker
  });
});
