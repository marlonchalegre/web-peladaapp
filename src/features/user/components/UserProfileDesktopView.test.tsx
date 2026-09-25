import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { getTheme } from "../../../lib/theme";
import UserProfileDesktopView, {
  type UserProfileDesktopViewProps,
} from "./UserProfileDesktopView";
import type { User, UserProfileDashboard } from "../../../shared/api/endpoints";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      fallback?: string | Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => {
      let text = typeof fallback === "string" ? fallback : key;
      const opts = (typeof fallback === "object" ? fallback : options) || {};
      for (const [k, v] of Object.entries(opts)) {
        text = text.replace(new RegExp(`{{${k}}}`, "g"), String(v));
      }
      if (key === "common.positions.midfielder") return "Meio-campo";
      return text;
    },
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
}));

const mockDashboard: UserProfileDashboard = {
  year: 2026,
  summary: {
    avg_rating: 7.4,
    avg_stars: 4.2,
    matches_played: 21,
    goals: 18,
    assists: 32,
    titles: 4,
    mvp_count: 2,
    garcom_count: 2,
    attendance_rate: 85,
  },
  skills: {
    passing: 4.4,
    ball_control: 4.0,
    velocity: 3.2,
    shooting: 3.6,
    dribbling: 3.0,
    defending: 3.5,
    ratings_count: 19,
  },
  groups: [
    {
      organization_id: "o1",
      organization_name: "100Fôlego",
      peladas_played: 21,
      goals: 18,
      assists: 32,
      titles: 4,
    },
  ],
  presence: Array.from({ length: 12 }, (_, i) => ({
    week_start: `2026-0${(i % 9) + 1}-01`,
    status: (i === 3 ? "absent" : i === 6 ? "no_game" : "present") as
      | "present"
      | "absent"
      | "no_game",
  })),
  recent_peladas: [
    {
      id: "p1",
      scheduled_at: "2026-09-09T19:00:00Z",
      matches_count: 4,
      players_count: 22,
      champion_team_name: "Time 2",
      organization_id: "o1",
      organization_name: "100Fôlego",
      user: {
        player_id: "pl1",
        player_name: "Igor Matos",
        team_name: "Time 2",
        team_position: 1,
        goals: 2,
        assists: 1,
        own_goals: 0,
        avg_stars: 4.1,
        is_mvp: true,
        is_garcom: false,
      },
    },
  ],
};

describe("UserProfileDesktopView", () => {
  const mockUser: User = {
    id: "u1",
    name: "Igor Matos",
    username: "igormatos",
    email: "igor@example.com",
    position: "midfielder",
  };

  const defaultProps: UserProfileDesktopViewProps = {
    user: mockUser,
    name: "Igor Matos",
    username: "igormatos",
    position: "midfielder",
    userInitials: "IM",
    dashboard: mockDashboard,
    onEditClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders top banner with real summary metrics and badges", () => {
    render(<UserProfileDesktopView {...defaultProps} />);

    expect(screen.getByText("Igor Matos")).toBeInTheDocument();
    expect(screen.getByText(/@igormatos/i)).toBeInTheDocument();
    expect(screen.getByText("4 TÍTULOS")).toBeInTheDocument();
    expect(screen.getByText("2× MVP")).toBeInTheDocument();
    expect(screen.getByText("2× GARÇOM")).toBeInTheDocument();

    expect(screen.getByText("7,4")).toBeInTheDocument();
    expect(screen.getByText("NOTA MÉDIA")).toBeInTheDocument();
    expect(screen.getAllByText("21").length).toBeGreaterThan(0);
    expect(screen.getByText("JOGOS EM 2026")).toBeInTheDocument();
    expect(screen.getAllByText("85%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PRESENÇA").length).toBeGreaterThan(0);
  });

  it("renders subnav tabs and allows clicking", () => {
    render(<UserProfileDesktopView {...defaultProps} />);

    expect(screen.getByText("VISÃO GERAL")).toBeInTheDocument();
    expect(screen.getByText("HISTÓRICO DE JOGOS")).toBeInTheDocument();
    expect(screen.getAllByText("PAGAMENTOS").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("HISTÓRICO DE JOGOS"));
    expect(screen.getByText("HISTÓRICO DE JOGOS")).toBeInTheDocument();
  });

  it("renders skills card and real recent matches", () => {
    render(<UserProfileDesktopView {...defaultProps} />);

    expect(screen.getByText("FICHA DE HABILIDADES")).toBeInTheDocument();
    expect(screen.getByText("PASSE")).toBeInTheDocument();
    expect(screen.getByText("DOMÍNIO")).toBeInTheDocument();
    expect(screen.getByText("VELOCIDADE")).toBeInTheDocument();
    expect(screen.getByText("CHUTE")).toBeInTheDocument();
    expect(screen.getByText("DRIBLE")).toBeInTheDocument();
    expect(screen.getByText("MARCAÇÃO")).toBeInTheDocument();

    expect(screen.getByText("ÚLTIMAS PELADAS")).toBeInTheDocument();
    expect(screen.getByText("09/09")).toBeInTheDocument();
    expect(screen.getByText("2 gols · 1 assist.")).toBeInTheDocument();
    expect(screen.getByText("MVP")).toBeInTheDocument();
  });

  it("renders 12 weeks presence and per-group stats from the dashboard", () => {
    render(<UserProfileDesktopView {...defaultProps} />);

    expect(screen.getByText("PRESENÇA · 12 SEMANAS")).toBeInTheDocument();
    expect(screen.getByText("presente")).toBeInTheDocument();
    expect(screen.getByText("faltou")).toBeInTheDocument();
    expect(screen.getByText("sem jogo")).toBeInTheDocument();

    expect(screen.getAllByText("100Fôlego").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TÍTULOS").length).toBeGreaterThan(0);
  });

  it("calls onEditClick when clicking EDITAR button", () => {
    const onEditClick = vi.fn();
    render(
      <UserProfileDesktopView {...defaultProps} onEditClick={onEditClick} />,
    );

    fireEvent.click(screen.getByTestId("edit-profile-button"));
    expect(onEditClick).toHaveBeenCalledTimes(1);
  });

  it("renders SecureAvatar with user initials as fallback", () => {
    render(<UserProfileDesktopView {...defaultProps} />);
    const avatar = screen.getByTestId("secure-avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent("IM");
  });

  it("renders correctly under dark theme mode", () => {
    const darkTheme = getTheme("dark");
    render(
      <ThemeProvider theme={darkTheme}>
        <UserProfileDesktopView {...defaultProps} />
      </ThemeProvider>,
    );

    expect(screen.getByText("FICHA DE HABILIDADES")).toBeInTheDocument();
    expect(screen.getByText("VISÃO GERAL")).toBeInTheDocument();
    expect(screen.getByText("HISTÓRICO DE JOGOS")).toBeInTheDocument();
  });
});
