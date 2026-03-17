import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UserAttendanceStatus from "./UserAttendanceStatus";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import type { PlayerWithUser } from "../hooks/useAttendance";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("UserAttendanceStatus", () => {
  const mockPlayer = {
    id: 1,
    user_id: 1,
    organization_id: 1,
    user: {
      id: 1,
      name: "John Doe",
    },
    attendance_status: "pending" as const,
  };

  it("renders welcome message and prompt", () => {
    render(
      <ThemeContextProvider>
        <UserAttendanceStatus
          player={mockPlayer as PlayerWithUser}
          isUpdating={false}
          onUpdate={() => {}}
        />
      </ThemeContextProvider>,
    );

    expect(screen.getByText(/common.hello, John!/)).toBeInTheDocument();
    expect(
      screen.getByText("peladas.attendance.user_status.prompt"),
    ).toBeInTheDocument();
  });

  it("calls onUpdate when buttons are clicked", () => {
    const onUpdate = vi.fn();
    render(
      <ThemeContextProvider>
        <UserAttendanceStatus
          player={mockPlayer as PlayerWithUser}
          isUpdating={false}
          onUpdate={onUpdate}
        />
      </ThemeContextProvider>,
    );

    fireEvent.click(screen.getByTestId("attendance-confirm-button"));
    expect(onUpdate).toHaveBeenCalledWith("confirmed");

    fireEvent.click(screen.getByTestId("attendance-decline-button"));
    expect(onUpdate).toHaveBeenCalledWith("declined");
  });

  it("shows active state when confirmed", () => {
    const confirmedPlayer = {
      ...mockPlayer,
      attendance_status: "confirmed" as const,
    };
    render(
      <ThemeContextProvider>
        <UserAttendanceStatus
          player={confirmedPlayer as PlayerWithUser}
          isUpdating={false}
          onUpdate={() => {}}
        />
      </ThemeContextProvider>,
    );

    expect(
      screen.getByText("peladas.attendance.user_status.confirmed_msg"),
    ).toBeInTheDocument();
    const confirmButton = screen.getByTestId("attendance-confirm-button");
    // Check if it has the white background style (active)
    expect(confirmButton).toHaveStyle({
      backgroundColor: "rgb(255, 255, 255)",
    });
  });

  it("shows active state when declined", () => {
    const declinedPlayer = {
      ...mockPlayer,
      attendance_status: "declined" as const,
    };
    render(
      <ThemeContextProvider>
        <UserAttendanceStatus
          player={declinedPlayer as PlayerWithUser}
          isUpdating={false}
          onUpdate={() => {}}
        />
      </ThemeContextProvider>,
    );

    expect(
      screen.getByText("peladas.attendance.user_status.declined_msg"),
    ).toBeInTheDocument();
    const declineButton = screen.getByTestId("attendance-decline-button");
    // Check if it has the white background style (active)
    expect(declineButton).toHaveStyle({
      backgroundColor: "rgb(255, 255, 255)",
    });
  });
});
