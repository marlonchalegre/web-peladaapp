import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PeladaTeamsDesktopView, {
  type PeladaTeamsDesktopViewProps,
} from "./PeladaTeamsDesktopView";
import { MemoryRouter } from "react-router-dom";
import type { Pelada, Team, User } from "../../../shared/api/endpoints";

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

describe("PeladaTeamsDesktopView", () => {
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
    { id: "team-3", name: "Time 3", pelada_id: "pelada-1" },
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
    "team-3": [],
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

  const defaultProps: PeladaTeamsDesktopViewProps = {
    pelada: mockPelada,
    teams: mockTeams,
    teamPlayers: mockTeamPlayers,
    benchPlayers: mockBenchPlayers,
    homeGk: mockTeamPlayers["team-1"][0],
    awayGk: null,
    scores: { p1: 7.8, p2: 8.4, p3: 7.6, p4: 7.0 },
    isAdmin: true,
    processing: false,
    onDragStartPlayer: vi.fn(),
    dropToTeam: vi.fn(),
    dropToBench: vi.fn(),
    dropToFixedGk: vi.fn(),
    removeFixedGk: vi.fn(),
    onMoveToTeam: vi.fn(),
    onSendToBench: vi.fn(),
    onMoveToFixedGk: vi.fn(),
    onRandomizeTeams: vi.fn(),
    drawJustification: null,
    onCreateTeam: vi.fn(),
    onDeleteTeam: vi.fn(),
    onStartClick: vi.fn(),
    onCopyAnnouncement: vi.fn(),
    onToggleFixedGk: vi.fn(),
    currentUser: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header, sub-nav, teams, and Como Sortear card", () => {
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView {...defaultProps} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Sorteio de times")).toBeInTheDocument();
    expect(screen.getByText(/100Fôlego/i)).toBeInTheDocument();
    expect(screen.getByText("COMO SORTEAR")).toBeInTheDocument();
    expect(screen.getByText("Clássico")).toBeInTheDocument();
    expect(screen.getByText("Gemini")).toBeInTheDocument();
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByText("MANDAR NO ZAP")).toBeInTheDocument();
    expect(screen.getByText("SALVAR TIMES")).toBeInTheDocument();
    expect(screen.getByText("Time 1")).toBeInTheDocument();
    expect(screen.getByText("Time 2")).toBeInTheDocument();
    expect(screen.getByText("Time 3")).toBeInTheDocument();
    expect(screen.getAllByText("Wagner").length).toBeGreaterThan(0);
    expect(screen.getByText("Felipe M.")).toBeInTheDocument();
    expect(screen.getAllByText("VAGA LIVRE").length).toBeGreaterThan(0);
  });

  it("changes algorithm and triggers draw again", () => {
    const onRandomizeTeams = vi.fn();
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView
          {...defaultProps}
          onRandomizeTeams={onRandomizeTeams}
        />
      </MemoryRouter>,
    );

    const algoGemini = screen.getByTestId("algo-gemini");
    fireEvent.click(algoGemini);

    const drawBtn = screen.getByTestId("draw-again-button");
    fireEvent.click(drawBtn);

    expect(onRandomizeTeams).toHaveBeenCalledWith({
      algorithm: "gemini",
      useHistory: true,
    });
  });

  it("calls onCopyAnnouncement when clicking MANDAR NO ZAP", () => {
    const onCopyAnnouncement = vi.fn();
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView
          {...defaultProps}
          onCopyAnnouncement={onCopyAnnouncement}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("desktop-zap-button"));
    expect(onCopyAnnouncement).toHaveBeenCalled();
  });

  it("calls onStartClick when clicking SALVAR TIMES", () => {
    const onStartClick = vi.fn();
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView {...defaultProps} onStartClick={onStartClick} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("desktop-save-button"));
    expect(onStartClick).toHaveBeenCalled();
  });

  it("calls onCreateTeam when clicking + ADICIONAR TIME", () => {
    const onCreateTeam = vi.fn();
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView {...defaultProps} onCreateTeam={onCreateTeam} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("desktop-add-team-button"));
    expect(onCreateTeam).toHaveBeenCalledWith("Time 4");
  });

  it("shows the player position on bench cards instead of a waitlist label", () => {
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView {...defaultProps} />
      </MemoryRouter>,
    );

    expect(screen.getByText("meia · no banco")).toBeInTheDocument();
    expect(screen.queryByText(/veio da fila/)).not.toBeInTheDocument();
  });

  it("labels the draw action as SORTEAR", () => {
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView {...defaultProps} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("draw-again-button")).toHaveTextContent(
      "SORTEAR",
    );
  });

  it("updates the number of teams and players per team from the draw format steppers", () => {
    const onUpdateNumTeams = vi.fn();
    const onUpdatePlayersPerTeam = vi.fn();
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView
          {...defaultProps}
          onUpdateNumTeams={onUpdateNumTeams}
          onUpdatePlayersPerTeam={onUpdatePlayersPerTeam}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("num-teams-increment"));
    expect(onUpdateNumTeams).toHaveBeenCalledWith(4);

    fireEvent.click(screen.getByTestId("num-teams-decrement"));
    expect(onUpdateNumTeams).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByTestId("players-per-team-increment"));
    expect(onUpdatePlayersPerTeam).toHaveBeenCalledWith(6);

    fireEvent.click(screen.getByTestId("players-per-team-decrement"));
    expect(onUpdatePlayersPerTeam).toHaveBeenCalledWith(4);
  });

  it("sends the classic draw without history signals", () => {
    const onRandomizeTeams = vi.fn();
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView
          {...defaultProps}
          onRandomizeTeams={onRandomizeTeams}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("draw-again-button"));
    expect(onRandomizeTeams).toHaveBeenCalledWith({
      algorithm: "classic",
      useHistory: false,
    });
  });

  it("sends the GPT draw with history enabled by default", () => {
    const onRandomizeTeams = vi.fn();
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView
          {...defaultProps}
          onRandomizeTeams={onRandomizeTeams}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("algo-gpt"));
    fireEvent.click(screen.getByTestId("draw-again-button"));
    expect(onRandomizeTeams).toHaveBeenCalledWith({
      algorithm: "gpt",
      useHistory: true,
    });
  });

  it("lets an admin delete a team", () => {
    const onDeleteTeam = vi.fn().mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView {...defaultProps} onDeleteTeam={onDeleteTeam} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText("Excluir Time 1"));
    expect(onDeleteTeam).toHaveBeenCalledWith("team-1");
  });

  it("hides admin controls from non-admins", () => {
    render(
      <MemoryRouter>
        <PeladaTeamsDesktopView {...defaultProps} isAdmin={false} />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText(/Excluir Time/)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("desktop-add-team-button"),
    ).not.toBeInTheDocument();
  });
});
