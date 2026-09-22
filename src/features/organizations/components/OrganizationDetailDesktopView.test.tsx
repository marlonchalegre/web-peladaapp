import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import OrganizationDetailDesktopView from "./OrganizationDetailDesktopView";
import type { Organization, Pelada } from "../../../shared/api/endpoints";

type ViewProps = ComponentProps<typeof OrganizationDetailDesktopView>;

describe("OrganizationDetailDesktopView", () => {
  const org = {
    id: "org-1",
    name: "100Fôlego",
    owner_id: "1",
    default_location: "Arena Central · Quadra 1",
    default_max_players: 22,
  } as Organization;

  const mkPelada = (id: string, status: string, scheduled_at: string): Pelada =>
    ({
      id,
      organization_id: "org-1",
      status,
      scheduled_at,
    }) as Pelada;

  const peladas: Pelada[] = [
    mkPelada("f1", "attendance", "2099-10-01T12:00:00"),
    mkPelada("f2", "open", "2099-10-02T12:00:00"),
    mkPelada("p1", "attendance", "2020-10-03T12:00:00"),
    mkPelada("p2", "running", "2020-10-04T12:00:00"),
    mkPelada("c1", "closed", "2020-10-05T12:00:00"),
  ];

  const defaultProps: ViewProps = {
    org,
    peladas,
    totalPeladas: 5,
    isAdmin: true,
    playersCount: 14,
    waitlistCount: 2,
    onCreatePeladaSuccess: vi.fn(),
    onCreatePeladaQuick: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderView = (
    props: Partial<ViewProps> = {},
  ): ReturnType<typeof render> =>
    render(
      <MemoryRouter>
        <OrganizationDetailDesktopView {...defaultProps} {...props} />
      </MemoryRouter>,
    );

  it("renders the group tabs, metrics and agenda header", () => {
    renderView();
    expect(screen.getByLabelText("Group sub-navigation")).toBeInTheDocument();
    expect(screen.getByText("AGENDA DO GRUPO")).toBeInTheDocument();
    expect(screen.getByText("PELADAS")).toBeInTheDocument();
    expect(screen.getByText("MÉDIA DE PRESENÇA")).toBeInTheDocument();
    expect(screen.getByText("NA FILA DE ESPERA")).toBeInTheDocument();
    expect(screen.getByText("NOVA PELADA")).toBeInTheDocument();
  });

  it("shows all peladas with the TODAS filter by default", () => {
    renderView();
    expect(screen.getByText("01/10")).toBeInTheDocument();
    expect(screen.getByText("02/10")).toBeInTheDocument();
    expect(screen.getByText("03/10")).toBeInTheDocument();
    expect(screen.getByText("04/10")).toBeInTheDocument();
    expect(screen.getByText("05/10")).toBeInTheDocument();
  });

  it("ABERTAS filter keeps only peladas with an open list, regardless of date", () => {
    renderView();
    fireEvent.click(screen.getByText("ABERTAS"));
    expect(screen.getByText("01/10")).toBeInTheDocument();
    expect(screen.getByText("02/10")).toBeInTheDocument();
    expect(screen.getByText("03/10")).toBeInTheDocument();
    expect(screen.queryByText("04/10")).not.toBeInTheDocument();
    expect(screen.queryByText("05/10")).not.toBeInTheDocument();
  });

  it("PENDÊNCIA filter shows only overdue, not-yet-closed peladas", () => {
    renderView();
    fireEvent.click(screen.getByText("PENDÊNCIA"));
    // Overdue attendance and running peladas remain.
    expect(screen.getByText("03/10")).toBeInTheDocument();
    expect(screen.getByText("04/10")).toBeInTheDocument();
    // Future open lists and closed peladas are not pendências.
    expect(screen.queryByText("01/10")).not.toBeInTheDocument();
    expect(screen.queryByText("02/10")).not.toBeInTheDocument();
    expect(screen.queryByText("05/10")).not.toBeInTheDocument();
  });

  it("PENDÊNCIA is not a duplicate of ABERTAS", () => {
    renderView();
    fireEvent.click(screen.getByText("ABERTAS"));
    expect(screen.getAllByText(/FECHAR E SORTEAR/)).toHaveLength(3);
    expect(screen.queryByText(/VER SÚMULA/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("PENDÊNCIA"));
    // Overdue attendance still needs closing; the overdue running one needs
    // its summary reviewed — neither list matches ABERTAS exactly.
    expect(screen.getAllByText(/FECHAR E SORTEAR/)).toHaveLength(1);
    expect(screen.getAllByText(/VER SÚMULA/)).toHaveLength(1);
  });

  it("shows an empty message when the filter matches nothing", () => {
    renderView({ peladas: [] });
    fireEvent.click(screen.getByText("ABERTAS"));
    expect(
      screen.getByText("Nenhuma pelada encontrada nesta visualização."),
    ).toBeInTheDocument();
  });

  it("hides the quick-create form for non-admins", () => {
    renderView({ isAdmin: false });
    expect(screen.queryByText("NOVA PELADA")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("desktop-quick-pelada-location"),
    ).not.toBeInTheDocument();
  });

  it("seeds the quick-create location from the organization default", () => {
    renderView();
    expect(
      screen.getByTestId("desktop-quick-pelada-location-input"),
    ).toHaveValue("Arena Central · Quadra 1");
  });

  it("renders closed peladas with their history line when provided", () => {
    renderView({
      historyByPelada: {
        c1: {
          id: "c1",
          scheduled_at: "2020-10-05T12:00:00Z",
          location: null,
          max_players: 24,
          matches_count: 3,
          players_count: 18,
          champion_team_name: "Time A",
          user: {
            player_id: "pl1",
            player_name: "Igor",
            team_name: "Time A",
            team_position: 1,
            goals: 2,
            assists: 1,
            own_goals: 0,
            avg_stars: 4.5,
            is_mvp: true,
            is_garcom: false,
          },
        },
      },
    });
    expect(screen.getByText(/Encerrada · 3 partidas/)).toBeInTheDocument();
    expect(screen.getByText(/1º lugar · 2 G · 1 A · MVP/)).toBeInTheDocument();
  });
});
