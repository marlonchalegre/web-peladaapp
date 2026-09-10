import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ActiveMatchSupportLineupCard from "./ActiveMatchSupportLineupCard";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import type { Match, Player } from "../../../shared/api/endpoints";

describe("ActiveMatchSupportLineupCard", () => {
  const mockMatch: Match = {
    id: "match-1",
    pelada_id: "pelada-1",
    sequence: 1,
    home_team_id: "team-1",
    away_team_id: "team-2",
    home_score: 0,
    away_score: 0,
    support_camera_player_id: "player-3",
    support_stats_player_id: "player-4",
  };

  const mockOrgPlayerIdToUserId: Record<string, string> = {
    "player-3": "user-3",
    "player-4": "user-4",
  };

  const mockUserIdToName: Record<string, string> = {
    "user-3": "Carlos Camera",
    "user-4": "Samuel Stats",
  };

  const mockOrgPlayerIdToPlayer: Record<string, Player> = {
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
      member_type: "diarista",
    },
  };

  const mockTeamNameById: Record<string, string> = {
    "team-1": "Time A",
    "team-2": "Time B",
    "team-3": "Time C",
  };

  const mockPlayerTeamMap: Record<string, string> = {
    "player-3": "team-3",
    "player-4": "team-3",
  };

  it("renders camera and stats player names correctly", () => {
    render(
      <ThemeContextProvider>
        <ActiveMatchSupportLineupCard
          match={mockMatch}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          teamNameById={mockTeamNameById}
          playerTeamMap={mockPlayerTeamMap}
          isAdmin={true}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getAllByText("Carlos Camera").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Samuel Stats").length).toBeGreaterThan(0);
  });

  it("calls onSwapRoles when admin clicks swap button and does not render reroll dice", async () => {
    const onSwapRoles = vi.fn().mockResolvedValue(undefined);
    const onNavigateToSupportTab = vi.fn();

    render(
      <ThemeContextProvider>
        <ActiveMatchSupportLineupCard
          match={mockMatch}
          orgPlayerIdToUserId={mockOrgPlayerIdToUserId}
          userIdToName={mockUserIdToName}
          orgPlayerIdToPlayer={mockOrgPlayerIdToPlayer}
          teamNameById={mockTeamNameById}
          playerTeamMap={mockPlayerTeamMap}
          isAdmin={true}
          onSwapRoles={onSwapRoles}
          onNavigateToSupportTab={onNavigateToSupportTab}
        />
      </ThemeContextProvider>,
    );

    fireEvent.click(screen.getByTestId("swap-active-support-roles"));
    expect(onSwapRoles).toHaveBeenCalledWith(mockMatch);

    // Verify dice button is not present to avoid accidental clicks
    expect(
      screen.queryByTestId("reroll-active-support-match"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("view-full-support-schedule"));
    expect(onNavigateToSupportTab).toHaveBeenCalled();
  });
});
