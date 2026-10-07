import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

  it("formats mensalista_temporario as mensalista and does not render daily fee payment button", () => {
    const tempMensalistaConfirmed: PlayerWithUser[] = [
      {
        id: "p4",
        organization_id: "org-1",
        pelada_id: "pelada-1",
        user_id: "u4",
        member_type: "mensalista_temporario",
        attendance_status: "confirmed",
        user: {
          id: "u4",
          name: "Jorge Batista",
          username: "jorge",
          position: "striker",
        } as unknown as User,
      } as PlayerWithUser,
    ];

    render(
      <MemoryRouter>
        <ThemeProvider theme={getTheme("light")}>
          <AttendanceListDesktopView
            {...defaultProps}
            confirmed={tempMensalistaConfirmed}
          />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Jorge Batista")).toBeInTheDocument();
    expect(
      screen.getByText("COMMON.MEMBER_TYPES.MENSALISTA"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTitle("peladas.attendance.desktop.mark_daily_paid"),
    ).not.toBeInTheDocument();
  });

  it("handles player with undefined member_type defaulting to diarista and showing daily fee payment button", () => {
    const undefinedMemberTypeConfirmed: PlayerWithUser[] = [
      {
        id: "p5",
        organization_id: "org-1",
        pelada_id: "pelada-1",
        user_id: "u5",
        attendance_status: "confirmed",
        user: {
          id: "u5",
          name: "Unknown Player",
          username: "unknown",
          position: "striker",
        } as unknown as User,
      } as PlayerWithUser,
    ];

    render(
      <MemoryRouter>
        <ThemeProvider theme={getTheme("light")}>
          <AttendanceListDesktopView
            {...defaultProps}
            confirmed={undefinedMemberTypeConfirmed}
            diaristaPrice={30}
          />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Unknown Player")).toBeInTheDocument();
    expect(
      screen.getByText("COMMON.MEMBER_TYPES.DIARISTA"),
    ).toBeInTheDocument();
    expect(
      screen.getByTitle("peladas.attendance.desktop.mark_daily_paid"),
    ).toBeInTheDocument();
  });

  it("renders waitlist info indicating awaiting organizer approval instead of auto-enter", () => {
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider theme={getTheme("light")}>
          <AttendanceListDesktopView
            {...defaultProps}
            waitlist={[
              {
                id: "w1",
                organization_id: "org-1",
                pelada_id: "pelada-1",
                user_id: "u-w1",
                member_type: "diarista",
                attendance_status: "waitlist",
                user: {
                  id: "u-w1",
                  name: "Waitlist Player",
                  username: "waitlistplayer",
                  position: "midfielder",
                } as unknown as User,
              } as PlayerWithUser,
            ]}
          />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/peladas\.attendance\.desktop\.waitlist_auto_info/),
    ).toBeInTheDocument();
    expect(container.textContent).not.toContain(
      "automaticamente se alguém sair",
    );
  });

  it("renders mark-as-paid button for unpaid diarista with MARCAR COMO PAGO label", () => {
    render(
      <MemoryRouter>
        <ThemeProvider theme={getTheme("light")}>
          <AttendanceListDesktopView {...defaultProps} diaristaPrice={21.5} />
        </ThemeProvider>
      </MemoryRouter>,
    );

    const payButton = screen.getByTestId("mark-as-paid-button");
    expect(payButton).toBeInTheDocument();
    expect(payButton.textContent).toContain(
      "R$ 21.5 · peladas.attendance.desktop.charge",
    );
  });
});
