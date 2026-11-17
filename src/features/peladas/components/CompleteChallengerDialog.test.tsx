import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CompleteChallengerDialog } from "./CompleteChallengerDialog";

const mockGetChallengerCandidates = vi.fn();
const mockUpdateChallengerLineup = vi.fn();

vi.mock("../../../shared/api/endpoints", () => ({
  createApi: () => ({
    getChallengerCandidates: (...args: unknown[]) =>
      mockGetChallengerCandidates(...args),
    updateChallengerLineup: (...args: unknown[]) =>
      mockUpdateChallengerLineup(...args),
  }),
}));

describe("CompleteChallengerDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders fairness badges, draws only from eligible_by_fairness, and saves", async () => {
    mockGetChallengerCandidates.mockResolvedValue({
      needed: 1,
      away_team_id: "t2",
      bench_player_ids: ["p11", "p12", "p13", "p14"],
      selected_player_ids: ["p6"],
      candidates: [
        {
          player_id: "p7",
          consecutive_games: 1,
          total_games: 1,
          eligible_by_fairness: true,
        },
        {
          player_id: "p6",
          consecutive_games: 3,
          total_games: 3,
          eligible_by_fairness: false,
        },
      ],
    });
    mockUpdateChallengerLineup.mockResolvedValue({
      needed: 1,
      away_team_id: "t2",
      bench_player_ids: ["p11", "p12", "p13", "p14"],
      selected_player_ids: ["p7"],
      candidates: [],
    });

    const onSaved = vi.fn();
    const onClose = vi.fn();

    render(
      <CompleteChallengerDialog
        open={true}
        matchId="m2"
        teamName="Time 2"
        playerNameById={{ p6: "Player Six", p7: "Player Seven" }}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    expect(await screen.findByText("Player Seven")).toBeInTheDocument();
    expect(screen.getByText("Player Six")).toBeInTheDocument();
    expect(
      screen.getByText("peladas.matches.challenger.eligible"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("peladas.matches.challenger.over_limit"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("challenger-random-draw-button"));
    fireEvent.click(screen.getByTestId("challenger-save-button"));

    await waitFor(() => {
      expect(mockUpdateChallengerLineup).toHaveBeenCalledWith("m2", {
        player_ids: ["p7"],
      });
    });
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
