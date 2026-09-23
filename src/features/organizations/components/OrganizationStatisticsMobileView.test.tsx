import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import OrganizationStatisticsMobileView from "./OrganizationStatisticsMobileView";
import type {
  Organization,
  OrganizationPlayerStats,
  WeeklyPresence,
} from "../../../shared/api/endpoints";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
}));

type ViewProps = ComponentProps<typeof OrganizationStatisticsMobileView>;

const mkStat = (
  id: string,
  name: string,
  goal: number,
  assist: number,
  extra: Partial<OrganizationPlayerStats> = {},
): OrganizationPlayerStats =>
  ({
    player_id: id,
    user_id: id,
    player_name: name,
    peladas_played: 20,
    goal,
    assist,
    own_goal: 0,
    avg_rating: 7,
    titles: 0,
    total_peladas: 28,
    ...extra,
  }) as OrganizationPlayerStats;

describe("OrganizationStatisticsMobileView", () => {
  const org = { id: "org-1", name: "100Fôlego" } as Organization;

  const stats: OrganizationPlayerStats[] = [
    mkStat("u1", "Rafael Duarte", 30, 5, {
      titles: 9,
      avg_rating: 7.6,
      peladas_played: 28,
    }),
    mkStat("u2", "Zé Ricardo", 20, 8, {
      peladas_played: 28,
      avg_rating: 7.4,
    }),
    mkStat("u3", "Bruno S.", 18, 6),
    mkStat("u4", "Léo Prado", 17, 35, { avg_rating: 8.1 }),
    mkStat("u5", "Igor Matos", 16, 32, { avg_rating: 7.2 }),
    mkStat("u6", "Caio Bastos", 12, 4),
    mkStat("u7", "Marcos Vinícius", 10, 3),
    mkStat("u8", "Pedro", 8, 2),
    mkStat("u9", "João", 5, 1),
  ];

  const weeklyPresence: WeeklyPresence[] = Array.from(
    { length: 12 },
    (_, i) => ({
      week_start: new Date(2026, 5 + Math.floor(i / 4), 1 + (i % 4) * 7)
        .toISOString()
        .slice(0, 10),
      confirmed: i === 5 ? 11 : 18 + i,
    }),
  );

  const defaultProps: ViewProps = {
    org,
    stats,
    totalPeladas: 28,
    totalGoals: 312,
    avgGoals: "21.0",
    year: 2026,
    years: ["2026", "2025", "2024"],
    onYearChange: vi.fn(),
    currentUser: { id: "u5", name: "Igor Matos", username: "igor" },
    isAdmin: true,
    onOpenImport: vi.fn(),
    onOpenExport: vi.fn(),
    weeklyPresence,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderView = (props: Partial<ViewProps> = {}) =>
    render(
      <MemoryRouter>
        <OrganizationStatisticsMobileView {...defaultProps} {...props} />
      </MemoryRouter>,
    );

  it("renders the dark header with season metrics", () => {
    renderView();

    expect(screen.getByText("100FÔLEGO · FUTEBOL")).toBeInTheDocument();
    expect(screen.getByText("Estatísticas")).toBeInTheDocument();
    expect(screen.getByText("PELADAS")).toBeInTheDocument();
    expect(screen.getAllByText("GOLS").length).toBeGreaterThan(0);
    expect(screen.getByText("MÉDIA/JOGO")).toBeInTheDocument();
    expect(screen.getByText("JOGADORES")).toBeInTheDocument();
    expect(screen.getByText("312")).toBeInTheDocument();
    expect(screen.getByText("2026 ▾")).toBeInTheDocument();
  });

  it("renders the podium and the full ranking with the user row highlighted", () => {
    renderView();

    expect(screen.getByText("ARTILHARIA · TEMPORADA 2026")).toBeInTheDocument();
    expect(screen.getAllByText("Rafael Duarte").length).toBeGreaterThan(0);
    expect(screen.getByText("CLASSIFICAÇÃO COMPLETA")).toBeInTheDocument();
    expect(screen.getByText("· VOCÊ")).toBeInTheDocument();
    expect(screen.getByText("1 gol para o 4º lugar")).toBeInTheDocument();
    expect(screen.getByTestId("stats-rank-row-u5")).toBeInTheDocument();
  });

  it("switches metric tabs and updates the podium title", () => {
    renderView();

    fireEvent.click(screen.getByTestId("stats-metric-assists"));
    expect(screen.getByText("GARÇOM · TEMPORADA 2026")).toBeInTheDocument();
    expect(screen.getAllByText("Léo Prado").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId("stats-metric-rating"));
    expect(screen.getByText("NOTA MÉDIA · TEMPORADA 2026")).toBeInTheDocument();
  });

  it("expands the ranking with ver os outros", () => {
    renderView();

    expect(screen.getByText("Ver os outros 2 →")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("stats-show-all"));
    expect(screen.getByText("Ver menos ↑")).toBeInTheDocument();
  });

  it("renders the weekly presence chart and highlights", () => {
    renderView();

    expect(screen.getByText("PRESENÇA DO GRUPO · 12 SEMANAS")).toBeInTheDocument();
    expect(screen.getByTestId("presence-summary")).toHaveTextContent(
      /Média de 23 jogadores por pelada · pior semana em \d{2}\/\d{2} com 11/,
    );
    expect(screen.getByText("DESTAQUES DA TEMPORADA")).toBeInTheDocument();
    expect(screen.getByText("Mais títulos · 9 noites")).toBeInTheDocument();
    expect(screen.getByText("Presença perfeita · 28 de 28")).toBeInTheDocument();
    expect(screen.getByText("Maior nota média · 8,1")).toBeInTheDocument();
  });

  it("only shows import/export to admins", () => {
    const { unmount } = renderView({ isAdmin: true });
    expect(screen.getByTestId("import-stats-button")).toBeInTheDocument();
    unmount();

    renderView({ isAdmin: false });
    expect(screen.queryByTestId("import-stats-button")).not.toBeInTheDocument();
  });

  it("changes the season year from the header pill", () => {
    const onYearChange = vi.fn();
    renderView({ onYearChange });

    fireEvent.click(screen.getByTestId("stats-year-button"));
    fireEvent.click(screen.getByText("2025"));
    expect(onYearChange).toHaveBeenCalledWith(2025);
  });
});
