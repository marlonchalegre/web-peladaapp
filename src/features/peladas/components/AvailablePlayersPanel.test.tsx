import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AvailablePlayersPanel from "./AvailablePlayersPanel";
import type { Player, User } from "../../../shared/api/endpoints";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key.startsWith("common.positions.")) return key.split(".").pop();
      return key;
    },
  }),
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

// Mock window.alert
window.alert = vi.fn();

describe("AvailablePlayersPanel", () => {
  const mockPlayers: (Player & { user: User })[] = [
    {
      id: 101,
      user_id: 1,
      organization_id: 1,
      user: {
        id: 1,
        name: "Alice",
        username: "alice",
        email: "a@e.com",
        position: "Goalkeeper",
      },
    },
    {
      id: 102,
      user_id: 2,
      organization_id: 1,
      user: {
        id: 2,
        name: "Bob",
        username: "bob",
        email: "b@e.com",
        position: "Striker",
      },
    },
  ];

  it("renders list of players with positions", () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayersPanel
          players={mockPlayers}
          scores={{ 101: 9.0, 102: 8.0 }}
          onDropToBench={() => {}}
          onDragStartPlayer={() => {}}
          onAddPlayersFromOrg={async () => {}}
          organizationId={1}
          allPlayerIdsInPelada={[101, 102]}
          totalPlayersInPelada={2}
          averagePelada={8.5}
          balance={100}
          isAdmin={true}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("goalkeeper")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("striker")).toBeInTheDocument();
  });

  it("filters players by name search", () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayersPanel
          players={mockPlayers}
          scores={{ 101: 9.0, 102: 8.0 }}
          onDropToBench={() => {}}
          onDragStartPlayer={() => {}}
          onAddPlayersFromOrg={async () => {}}
          organizationId={1}
          allPlayerIdsInPelada={[101, 102]}
          totalPlayersInPelada={2}
          averagePelada={8.5}
          balance={100}
          isAdmin={true}
        />
      </ThemeContextProvider>,
    );

    const searchInput = screen.getByPlaceholderText(
      "peladas.panel.available.filter_placeholder",
    );
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("sorts players by position", () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayersPanel
          players={[mockPlayers[1], mockPlayers[0]]} // Striker first in array
          scores={{ 101: 9.0, 102: 8.0 }}
          onDropToBench={() => {}}
          onDragStartPlayer={() => {}}
          onAddPlayersFromOrg={async () => {}}
          organizationId={1}
          allPlayerIdsInPelada={[101, 102]}
          totalPlayersInPelada={2}
          averagePelada={8.5}
          balance={100}
        />
      </ThemeContextProvider>,
    );

    const playerRows = screen.getAllByTestId("player-row");
    expect(playerRows[0]).toHaveTextContent("Alice"); // GK
    expect(playerRows[1]).toHaveTextContent("Bob"); // Striker
  });

  it("calls copyToClipboard when Copy button is clicked", async () => {
    render(
      <ThemeContextProvider>
        <AvailablePlayersPanel
          players={mockPlayers}
          scores={{ 101: 9.0, 102: 8.0 }}
          onDropToBench={() => {}}
          onDragStartPlayer={() => {}}
          onAddPlayersFromOrg={async () => {}}
          organizationId={1}
          allPlayerIdsInPelada={[101, 102]}
          totalPlayersInPelada={2}
          averagePelada={8.5}
          balance={100}
          isAdmin={true}
        />
      </ThemeContextProvider>,
    );

    const copyButton = screen.getByText("common.copy");
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("common.actions.copy_success");
    });
  });
});
