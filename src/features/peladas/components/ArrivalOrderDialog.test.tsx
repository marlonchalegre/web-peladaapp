import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ArrivalOrderDialog from "./ArrivalOrderDialog";
import type { PlayerWithUser } from "./TeamsSection";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string) => defaultValue || _key,
  }),
}));

const makePlayer = (
  id: string,
  name: string,
  arrivalOrder?: number | null,
): PlayerWithUser => ({
  id,
  organization_id: "org-1",
  user_id: `u-${id}`,
  grade: 7,
  arrival_order: arrivalOrder ?? null,
  user: { id: `u-${id}`, name, username: name.toLowerCase() },
});

describe("ArrivalOrderDialog", () => {
  it("moves checked-in player to the top and calls onSaveOrder with updated order", () => {
    const onSaveOrder = vi.fn();
    const players = [
      makePlayer("p1", "Alice"),
      makePlayer("p2", "Bruno"),
      makePlayer("p3", "Carlos"),
    ];

    render(
      <ArrivalOrderDialog
        open
        onClose={vi.fn()}
        players={players}
        numTeams={2}
        playersPerTeam={1}
        onSaveOrder={onSaveOrder}
      />,
    );

    fireEvent.click(screen.getByTestId("checkin-btn-p3"));
    fireEvent.click(screen.getByTestId("save-and-draw-arrival-button"));

    expect(onSaveOrder).toHaveBeenCalledWith(["p3", "p1", "p2"], true);
  });

  it("saves order without drawing when clicking save-arrival-order-button", () => {
    const onSaveOrder = vi.fn();
    const players = [
      makePlayer("p1", "Alice", 2),
      makePlayer("p2", "Bruno", 1),
    ];

    render(
      <ArrivalOrderDialog
        open
        onClose={vi.fn()}
        players={players}
        numTeams={2}
        playersPerTeam={1}
        onSaveOrder={onSaveOrder}
      />,
    );

    fireEvent.click(screen.getByTestId("save-arrival-order-button"));
    expect(onSaveOrder).toHaveBeenCalledWith(["p2", "p1"], false);
  });
});
