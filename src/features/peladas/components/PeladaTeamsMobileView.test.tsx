import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PeladaTeamsMobileView, {
  type PeladaTeamsMobileViewProps,
} from "./PeladaTeamsMobileView";
import { MemoryRouter } from "react-router-dom";
import type { Pelada, Team, User } from "../../../shared/api/endpoints";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { number?: number } | string) => {
      if (key === "peladas.teams.default_name") {
        return `Time ${
          typeof options === "object" ? (options?.number ?? 1) : 1
        }`;
      }
      if (typeof options === "string") return options;
      return key;
    },
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
}));

describe("PeladaTeamsMobileView", () => {
  const mockPelada: Pelada = {
    id: "pelada-1",
    organization_id: "org-1",
    organization_name: "100Fôlego",
    scheduled_at: "2026-09-16T19:00:00Z",
    status: "open",
    players_per_team: 5,
    fixed_goalkeepers: true,
  } as Pelada;

  const mockUser: User = {
    id: "user-1",
    name: "Igor Matos",
    username: "igormatos",
    email: "igor@example.com",
  };

  const mockTeams: Team[] = [
    { id: "team-1", name: "Time 1", pelada_id: "pelada-1" },
    { id: "team-2", name: "Time 2", pelada_id: "pelada-1" },
  ];

  const mockTeamPlayers = {
    "team-1": [
      {
        id: "p1",
        pelada_id: "pelada-1",
        organization_id: "org-1",
        user_id: "u1",
        grade: 7.8,
        position: "goleiro",
        user: { id: "u1", name: "Wagner", username: "wagner" },
      },
      {
        id: "p2",
        pelada_id: "pelada-1",
        organization_id: "org-1",
        user_id: "u2",
        grade: 8.4,
        position: "atacante",
        user: { id: "u2", name: "Rafael D.", username: "rafael" },
      },
    ],
    "team-2": [
      {
        id: "p3",
        pelada_id: "pelada-1",
        organization_id: "org-1",
        user_id: "user-1",
        grade: 7.6,
        position: "meia",
        user: mockUser,
      },
    ],
  };

  const mockBenchPlayers = [
    {
      id: "p4",
      pelada_id: "pelada-1",
      organization_id: "org-1",
      user_id: "u4",
      grade: 7.0,
      position: "meia",
      user: { id: "u4", name: "Felipe M.", username: "felipe" },
    },
  ];

  const defaultProps: PeladaTeamsMobileViewProps = {
    pelada: mockPelada,
    teams: mockTeams,
    teamPlayers: mockTeamPlayers,
    benchPlayers: mockBenchPlayers,
    homeGk: mockTeamPlayers["team-1"][0],
    awayGk: null,
    scores: { "team-1": 16.2, "team-2": 7.6 },
    isAdmin: true,
    processing: false,
    onMoveToTeam: vi.fn(),
    onSendToBench: vi.fn(),
    onMoveToFixedGk: vi.fn(),
    onRemoveFixedGk: vi.fn(),
    onRandomizeTeams: vi.fn(),
    drawJustification: null,
    onOpenJustificationDialog: vi.fn(),
    onCreateTeam: vi.fn(),
    onDeleteTeam: vi.fn(),
    onStartClick: vi.fn(),
    onCopyAnnouncement: vi.fn(),
    onToggleFixedGk: vi.fn(),
    currentUser: mockUser,
    peladaTransactions: [],
    onMarkPaid: vi.fn(),
    onReversePayment: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props: Partial<PeladaTeamsMobileViewProps> = {}) => {
    return render(
      <MemoryRouter>
        <PeladaTeamsMobileView {...defaultProps} {...props} />
      </MemoryRouter>,
    );
  };

  it("renders mobile draw header and action buttons", () => {
    renderComponent();

    expect(screen.getByText("Sorteio de times")).toBeInTheDocument();
    expect(screen.getByText("SORTEAR")).toBeInTheDocument();
    expect(screen.getByText("INICIAR PELADA")).toBeInTheDocument();
    expect(screen.getByText("MANDAR NO ZAP")).toBeInTheDocument();
  });

  it("triggers onStartClick when clicking INICIAR PELADA", () => {
    renderComponent();

    const startBtn = screen.getByText("INICIAR PELADA");
    fireEvent.click(startBtn);

    expect(defaultProps.onStartClick).toHaveBeenCalledTimes(1);
  });

  it("triggers onCopyAnnouncement when clicking MANDAR NO ZAP", () => {
    renderComponent();

    const zapBtn = screen.getByText("MANDAR NO ZAP");
    fireEvent.click(zapBtn);

    expect(defaultProps.onCopyAnnouncement).toHaveBeenCalledTimes(1);
  });

  it("triggers onRandomizeTeams with selected algorithm and history toggle", () => {
    renderComponent();

    const openPanelBtn = screen.getByText("SORTEAR");
    fireEvent.click(openPanelBtn);

    const geminiBtn = screen.getByText("Equilíbrio tático");
    fireEvent.click(geminiBtn);

    const drawBtn = screen.getByTestId("draw-teams-button");
    fireEvent.click(drawBtn);

    expect(defaultProps.onRandomizeTeams).toHaveBeenCalledWith({
      algorithm: "gemini",
      useHistory: true,
    });
  });

  it("allows switching algorithm to ChatGPT", () => {
    renderComponent();

    const openPanelBtn = screen.getByText("SORTEAR");
    fireEvent.click(openPanelBtn);

    const gptBtn = screen.getByText("Por regras");
    fireEvent.click(gptBtn);

    const historySwitch = screen.getByRole("checkbox", {
      name: "Usar sinais históricos",
    });
    fireEvent.click(historySwitch);

    const drawBtn = screen.getByTestId("draw-teams-button");
    fireEvent.click(drawBtn);

    expect(defaultProps.onRandomizeTeams).toHaveBeenCalledWith({
      algorithm: "gpt",
      useHistory: false,
    });
  });

  it("updates the number of teams and players per team from the mobile draw format steppers", () => {
    const onUpdateNumTeams = vi.fn();
    const onUpdatePlayersPerTeam = vi.fn();
    renderComponent({ onUpdateNumTeams, onUpdatePlayersPerTeam });

    fireEvent.click(screen.getByText("SORTEAR"));

    fireEvent.click(screen.getByTestId("mobile-num-teams-increment"));
    expect(onUpdateNumTeams).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByTestId("mobile-players-per-team-increment"));
    expect(onUpdatePlayersPerTeam).toHaveBeenCalledWith(6);

    fireEvent.click(screen.getByTestId("mobile-players-per-team-decrement"));
    expect(onUpdatePlayersPerTeam).toHaveBeenCalledWith(4);
  });

  it("decrements the number of teams when more than two are configured", () => {
    const onUpdateNumTeams = vi.fn();
    renderComponent({
      pelada: { ...mockPelada, num_teams: 4 },
      onUpdateNumTeams,
    });

    fireEvent.click(screen.getByText("SORTEAR"));
    fireEvent.click(screen.getByTestId("mobile-num-teams-decrement"));
    expect(onUpdateNumTeams).toHaveBeenCalledWith(3);
  });

  it("toggles fixed goalkeepers switch", () => {
    renderComponent();

    const openPanelBtn = screen.getByText("SORTEAR");
    fireEvent.click(openPanelBtn);

    const fixedGkSwitch = screen.getByRole("checkbox", {
      name: "Goleiros fixos",
    });
    fireEvent.click(fixedGkSwitch);

    expect(defaultProps.onToggleFixedGk).toHaveBeenCalledWith(false);
  });

  it("renders teams, bench players and allows opening player action menu", () => {
    renderComponent();

    expect(screen.getByText("Time 1")).toBeInTheDocument();
    expect(screen.getByText("Wagner")).toBeInTheDocument();
    expect(screen.getByText("Rafael D.")).toBeInTheDocument();

    expect(screen.getByText(/BANCO/)).toBeInTheDocument();
    expect(screen.getByText("Felipe M.")).toBeInTheDocument();

    const moreButtons = screen.getAllByRole("button", {
      name: "Ações do jogador",
    });
    expect(moreButtons.length).toBeGreaterThan(0);
    fireEvent.click(moreButtons[0]);

    expect(screen.getByText("Enviar para o banco")).toBeInTheDocument();
  });

  it("renders AI justification card and triggers onOpenJustificationDialog", () => {
    renderComponent({
      drawJustification: {
        algorithm: "gemini",
        source: "board",
        players_considered: 10,
        use_history: false,
        history: { enabled: false },
        benched: [],
        teams: [],
        metrics: {
          squad_mean: 7.5,
          overall_gap: 0.1,
          defense_gap: 0.2,
          offense_gap: 0.1,
        },
      },
    });

    expect(screen.getByText("POR QUE FICOU ASSIM")).toBeInTheDocument();
    const verCompletaBtn = screen.getByText("VER JUSTIFICATIVA COMPLETA");
    expect(verCompletaBtn).toBeInTheDocument();

    fireEvent.click(verCompletaBtn);
    expect(defaultProps.onOpenJustificationDialog).toHaveBeenCalledTimes(1);
  });

  it("moves a player to another team through the action menu", () => {
    renderComponent();

    const menuButtons = screen.getAllByRole("button", {
      name: "Ações do jogador",
    });
    fireEvent.click(menuButtons[0]);

    expect(screen.getByText("Mover jogador para:")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: "Time 2" }));

    expect(defaultProps.onMoveToTeam).toHaveBeenCalledWith("p1", "team-2");
  });

  it("sends an unpaid diarista to the bench through the action menu", () => {
    renderComponent();

    const menuButtons = screen.getAllByRole("button", {
      name: "Ações do jogador",
    });
    fireEvent.click(menuButtons[0]);

    fireEvent.click(screen.getByText("Enviar para o banco"));
    expect(defaultProps.onSendToBench).toHaveBeenCalledWith("p1");
  });

  it("shows a PENDENTE badge for an unpaid diarista and charges them on click", () => {
    renderComponent({
      teamPlayers: {
        ...mockTeamPlayers,
        "team-1": [
          {
            ...mockTeamPlayers["team-1"][0],
            member_type: "diarista",
          },
          mockTeamPlayers["team-1"][1],
        ],
      },
    });

    expect(screen.getByText("PENDENTE")).toBeInTheDocument();
    fireEvent.click(screen.getByText("PENDENTE"));
    expect(defaultProps.onMarkPaid).toHaveBeenCalledWith("p1", 0);
  });

  it("shows a PAGO badge for a paid diarista and reverses payment on click", () => {
    renderComponent({
      teamPlayers: {
        ...mockTeamPlayers,
        "team-1": [
          {
            ...mockTeamPlayers["team-1"][0],
            member_type: "diarista",
          },
          mockTeamPlayers["team-1"][1],
        ],
      },
      peladaTransactions: [
        {
          id: "tx1",
          organization_id: "org-1",
          player_id: "p1",
          amount: 30,
          type: "income",
          category: "diarista_fee",
          payment_date: "2026-09-16",
          status: "paid",
        },
      ],
    });

    expect(screen.getByText("PAGO")).toBeInTheDocument();
    fireEvent.click(screen.getByText("PAGO"));
    expect(defaultProps.onReversePayment).toHaveBeenCalledWith("p1");
  });

  it("hides admin controls from non-admins", () => {
    renderComponent({ isAdmin: false });

    expect(
      screen.queryByRole("button", { name: "Ações do jogador" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("NOVA PELADA")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Goleiros fixos" }),
    ).not.toBeInTheDocument();
  });

  it("renders back button and navigates to organization page", () => {
    renderComponent();

    const backBtn = screen.getByTestId("back-to-org-button");
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/organizations/org-1");
  });

  it("navigates back (-1) when pelada has no organization_id", () => {
    renderComponent({
      pelada: { ...mockPelada, organization_id: "" },
    });

    const backBtn = screen.getByTestId("back-to-org-button");
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
