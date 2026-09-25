import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AttendanceListDesktopView from "./AttendanceListDesktopView";
import { ThemeProvider } from "@mui/material";
import { getTheme } from "../../../lib/theme";
import type { Pelada, User } from "../../../shared/api/endpoints";
import type { PlayerWithUser } from "../hooks/useAttendance";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockPelada: Pelada = {
  id: "pelada-1",
  organization_id: "org-1",
  organization_name: "Peladeiros FC",
  scheduled_at: "2026-09-25T19:00:00Z",
  status: "attendance",
  max_players: 14,
} as Pelada;

const mockConfirmed: PlayerWithUser[] = [
  {
    id: "p1",
    organization_id: "org-1",
    pelada_id: "pelada-1",
    user_id: "u1",
    member_type: "mensalista",
    attendance_status: "confirmed",
    user: {
      id: "u1",
      name: "Neymar Jr",
      username: "neymar",
      position: "striker",
    } as unknown as User,
  } as PlayerWithUser,
  {
    id: "p2",
    organization_id: "org-1",
    pelada_id: "pelada-1",
    user_id: "u2",
    member_type: "diarista",
    attendance_status: "confirmed",
    user: {
      id: "u2",
      name: "Alisson Becker",
      username: "alisson",
      position: "goalkeeper",
    } as unknown as User,
  } as PlayerWithUser,
];

const mockWaitlist: PlayerWithUser[] = [
  {
    id: "p3",
    organization_id: "org-1",
    pelada_id: "pelada-1",
    user_id: "u3",
    member_type: "convidado",
    attendance_status: "waitlist",
    user: {
      id: "u3",
      name: "Casemiro",
      username: "casemiro",
      position: "midfielder",
    } as unknown as User,
  } as PlayerWithUser,
];

const defaultProps = {
  pelada: mockPelada,
  confirmed: mockConfirmed,
  waitlist: mockWaitlist,
  declined: [],
  pending: [],
  currentPlayerAsPlayer: mockConfirmed[0],
  currentUser: {
    id: "u1",
    name: "Neymar Jr",
    username: "neymar",
    email: "neymar@test.com",
    admin_orgs: ["org-1"],
  } as User,
  isAdmin: true,
  onUpdateAttendance: vi.fn(),
  onUpdatePlayerAttendance: vi.fn(),
  onCloseAttendance: vi.fn(),
  dayNumber: 25,
  weekday: "Sex",
  month: "Set",
  timeStr: "19:00",
  locationStr: "Arena Central",
  maxPlayers: 14,
  diaristaPrice: 25,
};

import { MemoryRouter } from "react-router-dom";

describe("AttendanceListDesktopView", () => {
  it("renders correctly in light mode", () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={getTheme("light")}>
          <AttendanceListDesktopView {...defaultProps} />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Neymar Jr")).toBeInTheDocument();
    expect(screen.getByText("Alisson Becker")).toBeInTheDocument();
    expect(screen.getByText("Arena Central")).toBeInTheDocument();
    expect(
      screen.getByText("peladas.attendance.desktop.spots_label"),
    ).toBeInTheDocument();
  });

  it("renders correctly in dark mode without styling or contrast regressions", () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={getTheme("dark")}>
          <AttendanceListDesktopView {...defaultProps} />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Neymar Jr")).toBeInTheDocument();
    expect(screen.getByText("Alisson Becker")).toBeInTheDocument();
    expect(
      screen.getByText(/peladas\.attendance\.desktop\.waitlist_section/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("peladas.attendance.desktop.daily_fees_title"),
    ).toBeInTheDocument();
  });
});
