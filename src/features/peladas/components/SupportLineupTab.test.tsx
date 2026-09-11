import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SupportLineupTab from "./SupportLineupTab";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import type {
  Match,
  Team,
  TeamPlayer,
  Player,
} from "../../../shared/api/endpoints";

describe("SupportLineupTab", () => {
  const mockTeams: Team[] = [
    { id: "team-1", name: "Time A", pelada_id: "pelada-1" },
    { id: "team-2", name: "Time B", pelada_id: "pelada-1" },
    { id: "team-3", name: "Time C", pelada_id: "pelada-1" },
  ];

  const mockMatches: Match[] = [
    {
      id: "match-1",
      pelada_id: "pelada-1",
      sequence: 1,
      home_team_id: "team-1",
      away_team_id: "team-2",
      home_score: 1,
      away_score: 0,
      status: "finished",
      support_camera_player_id: "player-3",
      support_stats_player_id: "player-4",
    },
    {
      id: "match-2",
      pelada_id: "pelada-1",
      sequence: 2,
      home_team_id: "team-2",
      away_team_id: "team-3",
      home_score: 0,
      away_score: 0,
      status: "running",
      support_camera_player_id: "player-1",
      support_stats_player_id: "player-2",
    },
  ];

  const mockTeamPlayers: Record<string, TeamPlayer[]> = {
    "team-1": [
      { team_id: "team-1", player_id: "player-1" },
      { team_id: "team-1", player_id: "player-2" },
    ],
    "team-2": [
      { team_id: "team-2", player_id: "player-3" },
      { team_id: "team-2", player_id: "player-4" },
    ],
    "team-3": [
      { team_id: "team-3", player_id: "player-5" },
      { team_id: "team-3", player_id: "player-6" },
    ],
  };

  const mockOrgPlayerIdToUserId: Record<string, string> = {
    "player-1": "user-1",
    "player-2": "user-2",
    "player-3": "user-3",
    "player-4": "user-4",
    "player-5": "user-5",
    "player-6": "user-6",
  };

  const mockUserIdToName: Record<string, string> = {
    "user-1": "Alice",
    "user-2": "Bob",
    "user-3": "Charlie",
    "user-4": "David",
    "user-5": "Eve",
    "user-6": "Frank",
  };

  const mockOrgPlayerIdToPlayer: Record<string, Player> = {
    "player-1": {
      id: "player-1",
      organization_id: "org-1",
      user_id: "user-1",
      member_type: "mensalista",
    },
    "player-2": {
      id: "player-2",
      organization_id: "org-1",
      user_id: "user-2",
      member_type: "mensalista",
    },
    "player-3": {
      id: "player-3",
      organization_id: "org-1",
      user_id: "user-3",
      member_type: "mensalista",
    },
    "player-4": {
      id: "player-4",
      organization_id: "org-1",
      user_id: "user-4",
      member_type: "mensalista",
    },
    "player-5": {
      id: "player-5",
      organization_id: "org-1",
      user_id: "user-5",
      member_type: "mensalista",
    },
    "player-6": {
      id: "player-6",
      organization_id: "org-1",
      user_id: "user-6",
      member_type: "mensalista",
    },
  };

  it("renders matches and assigned support players", () => {
    render(
      <ThemeContextProvider>
        <SupportLineupTab
          matches={mockMatches}
          teams={mockTeams}
          teamPlayers={mockTeamPlayers}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          attendance={[]}
          isAdmin={false}
          onGenerateAll={vi.fn()}
          onUpdateMatch={vi.fn()}
          onRerollMatch={vi.fn()}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByTestId("support-lineup-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("support-lineup-row-2")).toBeInTheDocument();
    expect(screen.getAllByText("Charlie").length).toBeGreaterThan(0);
    expect(screen.getAllByText("David").length).toBeGreaterThan(0);
  });

  it("calls onRerollMatch when admin clicks reroll", async () => {
    const onRerollMatch = vi.fn().mockResolvedValue(undefined);
    const onUpdateMatch = vi.fn().mockResolvedValue(undefined);

    render(
      <ThemeContextProvider>
        <SupportLineupTab
          matches={mockMatches}
          teams={mockTeams}
          teamPlayers={mockTeamPlayers}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          attendance={[]}
          isAdmin={true}
          onGenerateAll={vi.fn()}
          onUpdateMatch={onUpdateMatch}
          onRerollMatch={onRerollMatch}
        />
      </ThemeContextProvider>,
    );

    fireEvent.click(screen.getByTestId("reroll-support-match-1"));
    const confirmBtn =
      screen.queryByTestId("pretty-confirm-button") ||
      screen.getByText(/common\.confirm|Confirmar|Re-sortear/i);
    expect(confirmBtn).toBeInTheDocument();
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onRerollMatch).toHaveBeenCalledWith("match-1");
    });
  });

  it("calls onUpdateMatch when admin swaps roles", async () => {
    const onRerollMatch = vi.fn().mockResolvedValue(undefined);
    const onUpdateMatch = vi.fn().mockResolvedValue(undefined);

    render(
      <ThemeContextProvider>
        <SupportLineupTab
          matches={mockMatches}
          teams={mockTeams}
          teamPlayers={mockTeamPlayers}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          attendance={[]}
          isAdmin={true}
          onGenerateAll={vi.fn()}
          onUpdateMatch={onUpdateMatch}
          onRerollMatch={onRerollMatch}
        />
      </ThemeContextProvider>,
    );

    fireEvent.click(screen.getByTestId("swap-support-roles-1"));
    await waitFor(() => {
      expect(onUpdateMatch).toHaveBeenCalledWith("match-1", {
        support_camera_player_id: "player-4",
        support_stats_player_id: "player-3",
      });
    });
  });

  it("opens participation dialog and lists all players with duties", async () => {
    render(
      <ThemeContextProvider>
        <SupportLineupTab
          matches={mockMatches}
          teams={mockTeams}
          teamPlayers={mockTeamPlayers}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          attendance={[]}
          isAdmin={false}
          onGenerateAll={vi.fn()}
          onUpdateMatch={vi.fn()}
          onRerollMatch={vi.fn()}
        />
      </ThemeContextProvider>,
    );

    const viewBtn = screen.getByTestId("view-participation-button");
    expect(viewBtn).toBeInTheDocument();
    fireEvent.click(viewBtn);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search_player_placeholder|Buscar jogador/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
  });

  it("filters players by search query in the participation dialog", async () => {
    render(
      <ThemeContextProvider>
        <SupportLineupTab
          matches={mockMatches}
          teams={mockTeams}
          teamPlayers={mockTeamPlayers}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          attendance={[]}
          isAdmin={false}
          onGenerateAll={vi.fn()}
          onUpdateMatch={vi.fn()}
          onRerollMatch={vi.fn()}
        />
      </ThemeContextProvider>,
    );

    fireEvent.click(screen.getByTestId("view-participation-button"));
    const searchInput = await screen.findByPlaceholderText(
      /search_player_placeholder|Buscar jogador/i,
    );

    fireEvent.change(searchInput, { target: { value: "Eve" } });
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByText("Eve").length).toBeGreaterThan(0);
    expect(within(dialog).queryByText("Alice")).not.toBeInTheDocument();

    // When searching for non-existent name
    fireEvent.change(searchInput, { target: { value: "UnknownPlayerXYZ" } });
    expect(
      within(dialog).getByText(/no_players_found|Nenhum jogador encontrado/i),
    ).toBeInTheDocument();
  });

  it("calls onGenerateAll when admin confirms reroll all", async () => {
    const onGenerateAll = vi.fn().mockResolvedValue(undefined);

    render(
      <ThemeContextProvider>
        <SupportLineupTab
          matches={mockMatches}
          teams={mockTeams}
          teamPlayers={mockTeamPlayers}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          attendance={[]}
          isAdmin={true}
          onGenerateAll={onGenerateAll}
          onUpdateMatch={vi.fn()}
          onRerollMatch={vi.fn()}
        />
      </ThemeContextProvider>,
    );

    fireEvent.click(screen.getByTestId("reroll-all-support-button"));

    // Confirmation dialog appears
    const confirmBtn =
      screen.queryByTestId("pretty-confirm-button") ||
      screen.getByText(/common\.confirm|Confirmar|Re-sortear/i);
    expect(confirmBtn).toBeInTheDocument();
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onGenerateAll).toHaveBeenCalled();
    });
  });

  it("hides admin action buttons when isAdmin is false", () => {
    render(
      <ThemeContextProvider>
        <SupportLineupTab
          matches={mockMatches}
          teams={mockTeams}
          teamPlayers={mockTeamPlayers}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          attendance={[]}
          isAdmin={false}
          onGenerateAll={vi.fn()}
          onUpdateMatch={vi.fn()}
          onRerollMatch={vi.fn()}
        />
      </ThemeContextProvider>,
    );

    expect(
      screen.queryByTestId("reroll-all-support-button"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("reroll-support-match-1"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("swap-support-roles-1"),
    ).not.toBeInTheDocument();
  });

  it("renders gracefully when support IDs are null/unassigned", () => {
    const unassignedMatches: Match[] = [
      {
        id: "match-empty",
        pelada_id: "pelada-1",
        sequence: 1,
        home_team_id: "team-1",
        away_team_id: "team-2",
        home_score: 0,
        away_score: 0,
        status: "scheduled",
        support_camera_player_id: null,
        support_stats_player_id: null,
      },
    ];

    render(
      <ThemeContextProvider>
        <SupportLineupTab
          matches={unassignedMatches}
          teams={mockTeams}
          teamPlayers={mockTeamPlayers}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          attendance={[]}
          isAdmin={false}
          onGenerateAll={vi.fn()}
          onUpdateMatch={vi.fn()}
          onRerollMatch={vi.fn()}
        />
      </ThemeContextProvider>,
    );

    expect(
      screen.getAllByText(/unassigned|Não definido/i).length,
    ).toBeGreaterThan(0);
  });

  it("handles WhatsApp notification confirmation flow for admin", async () => {
    const mockNotify = vi.fn().mockResolvedValue(undefined);

    render(
      <ThemeContextProvider>
        <SupportLineupTab
          matches={mockMatches}
          teams={mockTeams}
          teamPlayers={mockTeamPlayers}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          attendance={[]}
          isAdmin={true}
          onGenerateAll={vi.fn()}
          onUpdateMatch={vi.fn()}
          onRerollMatch={vi.fn()}
          onNotifyWhatsApp={mockNotify}
        />
      </ThemeContextProvider>,
    );

    const notifyBtn = screen.getByTestId("notify-whatsapp-support-button");
    expect(notifyBtn).toBeInTheDocument();
    expect(notifyBtn).toBeEnabled();

    fireEvent.click(notifyBtn);

    // Dialog should be visible
    expect(
      screen.getByText(/confirm_notify_title|Notificar Escalação de Suporte/i),
    ).toBeInTheDocument();
    const confirmBtn = screen.getByTestId("pretty-confirm-button");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("notify-support-success-alert"),
      ).toBeInTheDocument();
    });
  });

  it("disables WhatsApp notification button when no support assignments exist", () => {
    const unassignedMatches: Match[] = [
      {
        id: "match-empty",
        pelada_id: "pelada-1",
        sequence: 1,
        home_team_id: "team-1",
        away_team_id: "team-2",
        home_score: 0,
        away_score: 0,
        status: "scheduled",
        support_camera_player_id: null,
        support_stats_player_id: null,
      },
    ];

    render(
      <ThemeContextProvider>
        <SupportLineupTab
          matches={unassignedMatches}
          teams={mockTeams}
          teamPlayers={mockTeamPlayers}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          attendance={[]}
          isAdmin={true}
          onGenerateAll={vi.fn()}
          onUpdateMatch={vi.fn()}
          onRerollMatch={vi.fn()}
          onNotifyWhatsApp={vi.fn()}
        />
      </ThemeContextProvider>,
    );

    const notifyBtn = screen.getByTestId("notify-whatsapp-support-button");
    expect(notifyBtn).toBeDisabled();
  });
});
