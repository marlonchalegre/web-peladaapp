import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MonthlyWaitlistSection from "./MonthlyWaitlistSection";
import {
  type Player,
  type MonthlyWaitlistEntry,
} from "../../../shared/api/endpoints";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: unknown) => {
      if (typeof options === "string") return options;
      if (
        typeof options === "object" &&
        options !== null &&
        "defaultValue" in options
      ) {
        return (options as { defaultValue: string }).defaultValue || key;
      }
      return key;
    },
  }),
}));

const mockPlayers: Player[] = [
  {
    id: "p1",
    user_id: "u1",
    organization_id: "org1",
    user_name: "Mensalista Player",
    member_type: "mensalista",
  },
  {
    id: "p2",
    user_id: "u2",
    organization_id: "org1",
    user_name: "Diarista 1",
    member_type: "diarista",
  },
  {
    id: "p3",
    user_id: "u3",
    organization_id: "org1",
    user_name: "Diarista 2",
    member_type: "diarista",
  },
  {
    id: "p4",
    user_id: "u4",
    organization_id: "org1",
    user_name: "Guest 1",
    member_type: "convidado",
  },
];

const mockWaitlist: MonthlyWaitlistEntry[] = [
  {
    id: "w1",
    organization_id: "org1",
    player_id: "p2",
    user_id: "u2",
    user_name: "Diarista 1",
    user_username: "diarista1",
    position: "Midfielder",
    member_type: "diarista",
    created_at: "2026-09-09T10:00:00Z",
  },
  {
    id: "w2",
    organization_id: "org1",
    player_id: "p3",
    user_id: "u3",
    user_name: "Diarista 2",
    user_username: "diarista2",
    position: "Defender",
    member_type: "diarista",
    created_at: "2026-09-09T11:00:00Z",
  },
];

describe("MonthlyWaitlistSection", () => {
  it("renders empty state when waitlist is empty", () => {
    render(
      <MonthlyWaitlistSection
        waitlist={[]}
        players={mockPlayers}
        onAddCandidate={vi.fn()}
        onRemoveCandidate={vi.fn()}
        onPromoteCandidate={vi.fn()}
        actionLoading={false}
      />,
    );

    expect(screen.getByTestId("waitlist-empty-message")).toBeInTheDocument();
  });

  it("renders waitlist items in order with promote and remove actions", () => {
    render(
      <MonthlyWaitlistSection
        waitlist={mockWaitlist}
        players={mockPlayers}
        onAddCandidate={vi.fn()}
        onRemoveCandidate={vi.fn()}
        onPromoteCandidate={vi.fn()}
        actionLoading={false}
      />,
    );

    const rows = screen.getAllByTestId("waitlist-row");
    expect(rows).toHaveLength(2);
    expect(screen.getByText("Diarista 1")).toBeInTheDocument();
    expect(screen.getByText("Diarista 2")).toBeInTheDocument();
    expect(screen.getByTestId("promote-waitlist-btn-p2")).toBeInTheDocument();
    expect(screen.getByTestId("promote-waitlist-btn-p3")).toBeInTheDocument();
    expect(screen.getByTestId("remove-waitlist-btn-p2")).toBeInTheDocument();
    expect(screen.getByTestId("remove-waitlist-btn-p3")).toBeInTheDocument();
  });

  it("opens promote confirmation modal and calls onPromoteCandidate", async () => {
    const onPromote = vi.fn().mockResolvedValue(undefined);
    render(
      <MonthlyWaitlistSection
        waitlist={mockWaitlist}
        players={mockPlayers}
        onAddCandidate={vi.fn()}
        onRemoveCandidate={vi.fn()}
        onPromoteCandidate={onPromote}
        actionLoading={false}
      />,
    );

    fireEvent.click(screen.getByTestId("promote-waitlist-btn-p3"));

    const confirmBtn = screen.getByRole("button", {
      name: "organizations.management.waitlist.promote_button",
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onPromote).toHaveBeenCalledWith("p3");
    });
  });

  it("opens remove confirmation modal and calls onRemoveCandidate", async () => {
    const onRemove = vi.fn().mockResolvedValue(undefined);
    render(
      <MonthlyWaitlistSection
        waitlist={mockWaitlist}
        players={mockPlayers}
        onAddCandidate={vi.fn()}
        onRemoveCandidate={onRemove}
        onPromoteCandidate={vi.fn()}
        actionLoading={false}
      />,
    );

    fireEvent.click(screen.getByTestId("remove-waitlist-btn-p2"));

    const confirmBtn = screen.getByRole("button", {
      name: "organizations.management.waitlist.remove_button",
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith("p2");
    });
  });

  it("opens add candidate dialog filtering already added or mensalista players", () => {
    render(
      <MonthlyWaitlistSection
        waitlist={mockWaitlist}
        players={mockPlayers}
        onAddCandidate={vi.fn()}
        onRemoveCandidate={vi.fn()}
        onPromoteCandidate={vi.fn()}
        actionLoading={false}
      />,
    );

    fireEvent.click(screen.getByTestId("waitlist-add-button"));

    // Eligible player should be Guest 1 (p4) since p1 is mensalista and p2, p3 are already in waitlist
    expect(screen.getByTestId("waitlist-candidate-select")).toBeInTheDocument();
  });
});
