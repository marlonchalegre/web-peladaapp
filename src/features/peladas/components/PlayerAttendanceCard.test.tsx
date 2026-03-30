import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PlayerAttendanceCard from "./PlayerAttendanceCard";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import type { PlayerWithUser } from "../hooks/useAttendance";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("PlayerAttendanceCard", () => {
  const mockPlayer = {
    id: 1,
    user_id: 1,
    organization_id: 1,
    member_type: "mensalista" as const,
    user: {
      id: 1,
      name: "John Doe",
      username: "johndoe",
      position: "Striker",
    },
    attendance_status: "confirmed" as const,
  };

  it("renders player name, position and member type", () => {
    render(
      <ThemeContextProvider>
        <PlayerAttendanceCard
          player={mockPlayer as PlayerWithUser}
          isAdmin={false}
          isCurrentUser={false}
          onUpdate={() => {}}
          isUpdating={false}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("common.positions.striker")).toBeInTheDocument();
    expect(
      screen.getByText("• common.member_types.mensalista"),
    ).toBeInTheDocument();
  });

  it("renders 'you' label for current user", () => {
    render(
      <ThemeContextProvider>
        <PlayerAttendanceCard
          player={mockPlayer as PlayerWithUser}
          isAdmin={false}
          isCurrentUser={true}
          onUpdate={() => {}}
          isUpdating={false}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("common.you")).toBeInTheDocument();
    // For current user, it should show " • common.positions.striker"
    expect(screen.getByText(/• common.positions.striker/)).toBeInTheDocument();
  });

  it("handles missing position", () => {
    const playerNoPos = {
      ...mockPlayer,
      user: { ...mockPlayer.user, position: undefined },
    };
    render(
      <ThemeContextProvider>
        <PlayerAttendanceCard
          player={playerNoPos as PlayerWithUser}
          isAdmin={false}
          isCurrentUser={false}
          onUpdate={() => {}}
          isUpdating={false}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByText("common.positions.unknown")).toBeInTheDocument();
  });

  it("handles missing member type", () => {
    const playerNoType = {
      ...mockPlayer,
      member_type: undefined,
    };
    render(
      <ThemeContextProvider>
        <PlayerAttendanceCard
          player={playerNoType as PlayerWithUser}
          isAdmin={false}
          isCurrentUser={false}
          onUpdate={() => {}}
          isUpdating={false}
        />
      </ThemeContextProvider>,
    );

    expect(screen.queryByText(/common.member_types/)).not.toBeInTheDocument();
  });

  it("shows action buttons only when user is admin", () => {
    const { rerender } = render(
      <ThemeContextProvider>
        <PlayerAttendanceCard
          player={
            { ...mockPlayer, attendance_status: "pending" } as PlayerWithUser
          }
          isAdmin={true}
          isCurrentUser={false}
          onUpdate={() => {}}
          isUpdating={false}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByTestId("attendance-card-confirm")).toBeInTheDocument();
    expect(screen.getByTestId("attendance-card-decline")).toBeInTheDocument();

    // Rerender as non-admin current user
    rerender(
      <ThemeContextProvider>
        <PlayerAttendanceCard
          player={
            { ...mockPlayer, attendance_status: "pending" } as PlayerWithUser
          }
          isAdmin={false}
          isCurrentUser={true}
          onUpdate={() => {}}
          isUpdating={false}
        />
      </ThemeContextProvider>,
    );

    expect(
      screen.queryByTestId("attendance-card-confirm"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("attendance-card-decline"),
    ).not.toBeInTheDocument();
  });

  it("shows payment icons for diaristas when admin", () => {
    const diarista = { ...mockPlayer, member_type: "diarista" };
    const onMarkPaid = vi.fn();
    const onReversePayment = vi.fn();

    const { rerender } = render(
      <ThemeContextProvider>
        <PlayerAttendanceCard
          player={diarista as PlayerWithUser}
          isAdmin={true}
          isCurrentUser={false}
          onUpdate={() => {}}
          isUpdating={false}
          isPaid={false}
          onMarkPaid={onMarkPaid}
          onReversePayment={onReversePayment}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByTestId("mark-as-paid-button")).toBeInTheDocument();

    rerender(
      <ThemeContextProvider>
        <PlayerAttendanceCard
          player={diarista as PlayerWithUser}
          isAdmin={true}
          isCurrentUser={false}
          onUpdate={() => {}}
          isUpdating={false}
          isPaid={true}
          onMarkPaid={onMarkPaid}
          onReversePayment={onReversePayment}
        />
      </ThemeContextProvider>,
    );

    const reverseBtn = screen.getByTestId("reverse-payment-button");
    expect(reverseBtn).toBeInTheDocument();

    reverseBtn.click();
    expect(onReversePayment).toHaveBeenCalled();
  });
});
