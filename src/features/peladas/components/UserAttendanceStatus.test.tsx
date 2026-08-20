import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UserAttendanceStatus from "./UserAttendanceStatus";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import type { PlayerWithUser } from "../hooks/useAttendance";

let mockT: (key: string, options?: { returnObjects?: boolean }) => unknown = (
  key: string,
) => key;

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) =>
      mockT(key, options),
  }),
}));

describe("UserAttendanceStatus", () => {
  const mockPlayer = {
    id: "1",
    user_id: "1",
    organization_id: "1",
    user: {
      id: "1",
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

  it("does not show active state for either button when pending", () => {
    render(
      <ThemeContextProvider>
        <UserAttendanceStatus
          player={mockPlayer as PlayerWithUser}
          isUpdating={false}
          onUpdate={() => {}}
        />
      </ThemeContextProvider>,
    );

    const confirmButton = screen.getByTestId("attendance-confirm-button");
    const declineButton = screen.getByTestId("attendance-decline-button");

    // Neither button should have a white background
    expect(confirmButton).not.toHaveStyle({
      backgroundColor: "rgb(255, 255, 255)",
    });
    expect(declineButton).not.toHaveStyle({
      backgroundColor: "rgb(255, 255, 255)",
    });
  });

  beforeEach(() => {
    mockT = (key: string) => key;
  });

  it("selects a prompt from the prompt pool array when available", () => {
    mockT = (key: string, options?: { returnObjects?: boolean }) => {
      if (
        key === "peladas.attendance.user_status.prompts" &&
        options?.returnObjects
      ) {
        return ["Prompt 1", "Prompt 2", "Prompt 3"];
      }
      return key;
    };

    render(
      <ThemeContextProvider>
        <UserAttendanceStatus
          player={mockPlayer as PlayerWithUser}
          isUpdating={false}
          onUpdate={() => {}}
        />
      </ThemeContextProvider>,
    );

    const renderedPrompt = screen.getByText(/Prompt [123]/);
    expect(renderedPrompt).toBeInTheDocument();
  });

  it("falls back to default prompt key when prompt pool is empty", () => {
    mockT = (key: string, options?: { returnObjects?: boolean }) => {
      if (
        key === "peladas.attendance.user_status.prompts" &&
        options?.returnObjects
      ) {
        return [];
      }
      return key;
    };

    render(
      <ThemeContextProvider>
        <UserAttendanceStatus
          player={mockPlayer as PlayerWithUser}
          isUpdating={false}
          onUpdate={() => {}}
        />
      </ThemeContextProvider>,
    );

    expect(
      screen.getByText("peladas.attendance.user_status.prompt"),
    ).toBeInTheDocument();
  });

  it("shows waitlist status message when player status is waitlist", () => {
    const waitlistPlayer = {
      ...mockPlayer,
      attendance_status: "waitlist" as const,
    };
    render(
      <ThemeContextProvider>
        <UserAttendanceStatus
          player={waitlistPlayer as PlayerWithUser}
          isUpdating={false}
          onUpdate={() => {}}
        />
      </ThemeContextProvider>,
    );

    expect(
      screen.getByText("peladas.attendance.user_status.waitlist_msg"),
    ).toBeInTheDocument();
  });
});
