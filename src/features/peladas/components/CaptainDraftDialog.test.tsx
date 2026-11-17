import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CaptainDraftDialog from "./CaptainDraftDialog";
import type { Team } from "../../../shared/api/types";
import type { PlayerWithUser } from "./TeamsSection";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string) => defaultValue || _key,
  }),
}));

const makePlayer = (
  id: string,
  name: string,
  grade: number,
): PlayerWithUser => ({
  id,
  organization_id: "org-1",
  user_id: `u-${id}`,
  grade,
  user: { id: `u-${id}`, name, username: name.toLowerCase() },
});

const teams: Team[] = [
  { id: "t1", pelada_id: "pel-1", name: "Time 1" },
  { id: "t2", pelada_id: "pel-1", name: "Time 2" },
];

const players: PlayerWithUser[] = [
  makePlayer("p1", "Cap 1", 9),
  makePlayer("p2", "Cap 2", 8),
  makePlayer("p3", "Pick A", 7),
  makePlayer("p4", "Pick B", 6),
  makePlayer("p5", "Pick C", 5),
  makePlayer("p6", "Pick D", 4),
];

describe("CaptainDraftDialog", () => {
  it("picks captains and drafts players in snake order (t1 -> t2 -> t2 -> t1)", () => {
    const onConfirmDraft = vi.fn();
    render(
      <CaptainDraftDialog
        open
        onClose={vi.fn()}
        teams={teams}
        players={players}
        playersPerTeam={3}
        onConfirmDraft={onConfirmDraft}
      />,
    );

    fireEvent.click(screen.getByTestId("auto-pick-captains-grade"));
    fireEvent.click(screen.getByTestId("start-snake-draft-button"));

    fireEvent.click(screen.getByTestId("draft-player-p3"));
    fireEvent.click(screen.getByTestId("draft-player-p4"));
    fireEvent.click(screen.getByTestId("draft-player-p5"));
    fireEvent.click(screen.getByTestId("draft-player-p6"));

    fireEvent.click(screen.getByTestId("confirm-captain-draft-button"));
    expect(onConfirmDraft).toHaveBeenCalledWith({
      t1: ["p1", "p3", "p6"],
      t2: ["p2", "p4", "p5"],
    });
  });
});
