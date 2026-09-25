import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ThemeProvider } from "@mui/material";
import { getTheme } from "../../../lib/theme";
import type { ComponentProps } from "react";
import OrganizationDetailMobileView from "./OrganizationDetailMobileView";
import type {
  Organization,
  OrganizationPlayerStats,
  Pelada,
  PeladaHistoryEntry,
  Player,
} from "../../../shared/api/endpoints";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
}));

type ViewProps = ComponentProps<typeof OrganizationDetailMobileView>;

describe("OrganizationDetailMobileView", () => {
  const org = {
    id: "org-1",
    name: "100Fôlego",
    owner_id: "user-1",
    default_max_players: 24,
    default_location: "Arena Central",
  } as Organization;

  const openPelada = {
    id: "pelada-open",
    organization_id: "org-1",
    status: "attendance",
    scheduled_at: "2099-09-16T19:00:00Z",
    max_players: 24,
    confirmed_count: 14,
    confirmed_preview: "Rafael Duarte|Zé Ricardo|Bruno S.",
  } as Pelada;

  const closedPelada = {
    id: "pelada-closed",
    organization_id: "org-1",
    status: "closed",
    scheduled_at: "2026-09-09T19:00:00Z",
  } as Pelada;

  const historyByPelada: Record<string, PeladaHistoryEntry> = {
    "pelada-closed": {
      id: "pelada-closed",
      scheduled_at: "2026-09-09T19:00:00Z",
      matches_count: 4,
      players_count: 22,
      champion_team_name: "Time A",
      user: {
        player_id: "pl-1",
        player_name: "Igor",
        team_name: "Time A",
        team_position: 1,
        goals: 2,
        assists: 1,
        own_goals: 0,
        is_mvp: true,
        is_garcom: false,
      },
    },
  };

  const players = [
    {
      id: "pl-1",
      user_id: "user-1",
      organization_id: "org-1",
      user_name: "Igor Matos",
      position: "Midfielder",
      member_type: "mensalista",
    },
    {
      id: "pl-2",
      user_id: "user-2",
      organization_id: "org-1",
      user_name: "Rafael Duarte",
      position: "Striker",
      member_type: "diarista",
    },
  ] as Player[];

  const memberStats = [
    {
      player_id: "pl-2",
      user_id: "user-2",
      player_name: "Rafael Duarte",
      peladas_played: 24,
      goal: 27,
      assist: 5,
      own_goal: 0,
      avg_rating: 7.8,
      titles: 9,
    },
    {
      player_id: "pl-1",
      user_id: "user-1",
      player_name: "Igor Matos",
      peladas_played: 20,
      goal: 16,
      assist: 32,
      own_goal: 0,
      avg_rating: 7.2,
      titles: 4,
    },
  ] as OrganizationPlayerStats[];

  const defaultProps: ViewProps = {
    org,
    peladas: [openPelada, closedPelada],
    totalPeladas: 25,
    historyByPelada,
    players,
    isAdmin: true,
    featureFlags: null,
    waitlistStatus: null,
    waitlistLoading: false,
    currentPlayer: players[0],
    currentUser: { id: "user-1", name: "Igor Matos", username: "igor" },
    memberStats,
    onJoinWaitlist: vi.fn(),
    onLeaveWaitlist: vi.fn(),
    onCreatePelada: vi.fn().mockResolvedValue(undefined),
    onDeletePelada: vi.fn(),
    onLeaveOrg: vi.fn(),
    onLoadMore: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderView = (props: Partial<ViewProps> = {}) =>
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter>
          <OrganizationDetailMobileView {...defaultProps} {...props} />
        </MemoryRouter>
      </LocalizationProvider>,
    );

  it("renders the admin header, counters, create form and agenda", () => {
    renderView();

    expect(screen.getByText("100Fôlego")).toBeInTheDocument();
    expect(screen.getByText(/FUTEBOL · ADMIN/)).toBeInTheDocument();
    expect(screen.getByText("PELADAS")).toBeInTheDocument();
    expect(screen.getByText("A RECEBER")).toBeInTheDocument();
    expect(screen.getByText("NA FILA")).toBeInTheDocument();
    expect(
      screen.getByText("organizations.detail.section.new_pelada"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("create-pelada-submit")).toBeInTheDocument();
    expect(screen.getByText("AGENDA DO GRUPO")).toBeInTheDocument();
    expect(screen.getByText("LISTA ABERTA")).toBeInTheDocument();
    expect(screen.getByText("14/24")).toBeInTheDocument();
    expect(screen.getByText("FECHAR E SORTEAR")).toBeInTheDocument();
    expect(screen.getByText("Encerrada · 4 partidas")).toBeInTheDocument();
    expect(screen.getByText(/1–2 de 25/)).toBeInTheDocument();
  });

  it("loads more peladas when tapping ver mais", () => {
    const onLoadMore = vi.fn();
    renderView({ onLoadMore });

    fireEvent.click(screen.getByTestId("load-more-peladas"));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it("requests pelada deletion from the open card", () => {
    const onDeletePelada = vi.fn();
    renderView({ onDeletePelada });

    fireEvent.click(
      screen.getAllByLabelText("organizations.peladas.aria.delete")[0],
    );
    expect(onDeletePelada).toHaveBeenCalledWith(openPelada);
  });

  it("renders the member next pelada, podium, roster and history", () => {
    renderView({ isAdmin: false });

    expect(screen.getByText(/FUTEBOL · MENSALISTA/)).toBeInTheDocument();
    expect(screen.getByText("PRÓXIMA PELADA")).toBeInTheDocument();
    expect(screen.getByText("BORA PRO JOGO")).toBeInTheDocument();
    expect(screen.getByText(/14/)).toBeInTheDocument();
    expect(screen.getByText("PÓDIO DA TEMPORADA")).toBeInTheDocument();
    expect(screen.getByText("ARTILHEIRO")).toBeInTheDocument();
    expect(screen.getByText("GARÇOM")).toBeInTheDocument();
    expect(screen.getByTestId("member-podium-you")).toBeInTheDocument();
    expect(screen.getByText("ELENCO · 2")).toBeInTheDocument();
    expect(screen.getByText("HISTÓRICO DO GRUPO")).toBeInTheDocument();
    expect(screen.getByText("TÍTULO")).toBeInTheDocument();
    expect(screen.queryByText("NOVA PELADA")).not.toBeInTheDocument();
  });

  it("opens the roster dialog from the ELENCO tile", () => {
    renderView({ isAdmin: false });

    fireEvent.click(screen.getByTestId("org-roster-button"));
    expect(screen.getByTestId("roster-close-button")).toBeInTheDocument();
    expect(screen.getAllByTestId("roster-row")).toHaveLength(2);
  });

  it("shows the monthly waitlist candidacy for non-mensalistas", () => {
    const onJoinWaitlist = vi.fn();
    renderView({
      isAdmin: false,
      currentPlayer: players[1],
      waitlistStatus: { in_queue: false },
      onJoinWaitlist,
    });

    fireEvent.click(screen.getByTestId("join-waitlist-button"));
    expect(onJoinWaitlist).toHaveBeenCalled();
  });

  it("shows the in-queue badge and leaves the waitlist", () => {
    const onLeaveWaitlist = vi.fn();
    renderView({
      isAdmin: false,
      currentPlayer: players[1],
      waitlistStatus: { in_queue: true },
      onLeaveWaitlist,
    });

    expect(screen.getByTestId("waitlist-in-queue-badge")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("leave-waitlist-button"));
    expect(onLeaveWaitlist).toHaveBeenCalled();
  });

  it("exposes management to admins and leave to members through the menu", () => {
    const onLeaveOrg = vi.fn();
    const { unmount } = renderView({ isAdmin: true });
    fireEvent.click(screen.getByTestId("org-menu-button"));
    expect(screen.getByTestId("org-management-button")).toBeInTheDocument();
    unmount();

    renderView({ isAdmin: false, onLeaveOrg });
    fireEvent.click(screen.getByTestId("org-menu-button"));
    fireEvent.click(screen.getByTestId("leave-org-button"));
    expect(onLeaveOrg).toHaveBeenCalled();
  });

  it("renders correctly in dark mode using theme tokens", () => {
    const darkTheme = getTheme("dark");
    render(
      <ThemeProvider theme={darkTheme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MemoryRouter>
            <OrganizationDetailMobileView {...defaultProps} />
          </MemoryRouter>
        </LocalizationProvider>
      </ThemeProvider>,
    );
    expect(screen.getByText("100Fôlego")).toBeInTheDocument();
    expect(screen.getByText("AGENDA DO GRUPO")).toBeInTheDocument();
  });
});
