import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SubstitutionsSection from "./SubstitutionsSection";
import {
  type Player,
  type MonthlyPlayerSubstitution,
} from "../../../shared/api/endpoints";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

const mockPlayers: Player[] = [
  {
    id: "p1",
    user_id: "u1",
    organization_id: "org1",
    user_name: "Rafa Lucena",
    member_type: "mensalista",
  },
  {
    id: "p2",
    user_id: "u2",
    organization_id: "org1",
    user_name: "Alan",
    member_type: "diarista",
  },
  {
    id: "p3",
    user_id: "u3",
    organization_id: "org1",
    user_name: "Mala",
    member_type: "mensalista",
  },
];

const mockSubstitutions: MonthlyPlayerSubstitution[] = [
  {
    id: "sub-1",
    organization_id: "org1",
    permanent_player_id: "p1",
    permanent_player_name: "Rafa Lucena",
    temporary_player_id: "p2",
    temporary_player_name: "Alan",
    start_date: "2026-08-01",
    active: true,
  },
  {
    id: "sub-2",
    organization_id: "org1",
    permanent_player_id: "p3",
    permanent_player_name: "Mala",
    temporary_player_id: "p2",
    temporary_player_name: "Alan",
    start_date: "2026-07-01",
    end_date: "2026-07-31",
    active: false,
  },
];

describe("SubstitutionsSection", () => {
  const defaultProps = {
    players: mockPlayers,
    substitutions: mockSubstitutions,
    onCreateSubstitution: vi.fn(),
    onEndSubstitution: vi.fn(),
    actionLoading: false,
  };

  it("renders substitution items with active and ended status chips", () => {
    render(<SubstitutionsSection {...defaultProps} />);

    expect(screen.getByText("Monthly Substitutions")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Ended")).toBeInTheDocument();
    expect(screen.getAllByText("Rafa Lucena")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Alan")[0]).toBeInTheDocument();
  });

  it("opens end substitution dialog and calls onEndSubstitution with selected date", () => {
    const onEndSubstitution = vi.fn();
    render(
      <SubstitutionsSection
        {...defaultProps}
        onEndSubstitution={onEndSubstitution}
      />,
    );

    const endBtn = screen.getByTestId("end-sub-btn-sub-1");
    fireEvent.click(endBtn);

    expect(screen.getByText("End Substitution")).toBeInTheDocument();
    expect(
      screen.getByText(/Select the end date for this substitution/),
    ).toBeInTheDocument();

    const dateInput = screen.getByTestId("end-date-input");
    fireEvent.change(dateInput, { target: { value: "2026-08-31" } });

    const confirmBtn = screen.getByTestId("confirm-end-sub-button");
    fireEvent.click(confirmBtn);

    expect(onEndSubstitution).toHaveBeenCalledWith("sub-1", "2026-08-31");
  });

  it("allows selecting quick option for end of previous month", () => {
    const onEndSubstitution = vi.fn();
    render(
      <SubstitutionsSection
        {...defaultProps}
        onEndSubstitution={onEndSubstitution}
      />,
    );

    fireEvent.click(screen.getByTestId("end-sub-btn-sub-1"));

    const prevMonthChip = screen.getByText(/End of previous month/);
    fireEvent.click(prevMonthChip);

    fireEvent.click(screen.getByTestId("confirm-end-sub-button"));

    expect(onEndSubstitution).toHaveBeenCalledWith(
      "sub-1",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });
});
