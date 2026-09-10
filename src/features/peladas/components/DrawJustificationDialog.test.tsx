import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DrawJustificationDialog from "./DrawJustificationDialog";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import type { DrawJustification } from "../../../shared/api/endpoints";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: unknown) => {
      if (options && typeof options === "object" && "count" in options) {
        return `${key}:${(options as { count: number }).count}`;
      }
      return key;
    },
  }),
}));

const player = (name: string, extra = {}) => ({
  id: `id-${name}`,
  name,
  position: "Midfielder",
  position_code: "M",
  grade: 8.2,
  ...extra,
});

const tacticalJustification: DrawJustification = {
  algorithm: "gpt",
  teams: [
    {
      index: 0,
      name: "Time 1",
      mean: 8.16,
      formation: "1-2-2",
      anchors: ["Alan"],
      short_history: ["Vitor"],
      players: [player("Alan", { is_anchor: true }), player("Vitor")],
      champion_pairs: [
        {
          players: ["Alan", "Felipe"],
          titles_together: 3,
          title_opportunities: 7,
        },
      ],
      top_pairs: [
        {
          players: ["Alan", "Felipe"],
          nights_together: 7,
          nights_both_present: 15,
        },
      ],
      assist_links: [{ from: "Alan", to: "Vitor", count: 3 }],
    },
    {
      index: 1,
      name: "Time 2",
      mean: 8.11,
      formation: "2-1-2",
      anchors: ["Igor"],
      short_history: [],
      players: [player("Igor", { is_anchor: true })],
      champion_pairs: [],
    },
  ],
  metrics: {
    squad_mean: 8.16,
    team_mean_gap: 0.08,
    sector_gap: 1.29,
    max_short_history_per_team: 1,
    anchors: ["Alan", "Igor"],
  },
  history: {
    enabled: true,
    weight: 0.2,
    changed_vs_baseline: true,
    moves: [{ name: "Franklin", from: 2, to: 3 }],
  },
  benched: [{ name: "Reserva", grade: 7.1 }],
  use_history: true,
  players_considered: 20,
  source: "confirmed_attendance",
};

const chemistryJustification: DrawJustification = {
  algorithm: "gemini",
  teams: [
    {
      index: 0,
      name: "Time 1",
      mean: 8.3,
      formation: "1-2-2",
      overall: 7.64,
      defense: 7.66,
      offense: 7.53,
      titles_total: 24,
      drought_total: 5,
      top_winner: { name: "Felipe", titles: 9 },
      longest_drought: { name: "Rafa", drought: 4 },
      new_pairs: [{ players: ["Felipe", "Leandro"], faced_each_other: 17 }],
      champion_pairs: [{ players: ["Marlon", "Leandro"], titles_together: 2 }],
      players: [player("Felipe")],
    },
  ],
  metrics: {
    squad_mean: 8.16,
    overall_gap: 0.147,
    defense_gap: 0.152,
    offense_gap: 0.271,
  },
  history: { enabled: true },
  benched: [],
  use_history: true,
  players_considered: 20,
  source: "confirmed_attendance",
};

const renderDialog = (justification: DrawJustification | null) =>
  render(
    <ThemeContextProvider>
      <DrawJustificationDialog
        open
        onClose={vi.fn()}
        justification={justification}
      />
    </ThemeContextProvider>,
  );

describe("DrawJustificationDialog", () => {
  it("renders nothing without a justification", () => {
    const { container } = renderDialog(null);
    expect(container.firstChild).toBeNull();
  });

  it("lists one panel per team", () => {
    renderDialog(tacticalJustification);

    expect(screen.getByTestId("draw-report-team-0")).toBeInTheDocument();
    expect(screen.getByTestId("draw-report-team-1")).toBeInTheDocument();
  });

  it("shows how many players were drawn and where they came from", () => {
    renderDialog(tacticalJustification);

    expect(
      screen.getByText(/peladas.detail.draw_report.players_considered:20/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/peladas.detail.draw_report.source_attendance/),
    ).toBeInTheDocument();
  });

  it("names the reference players of the tactical draw", () => {
    renderDialog(tacticalJustification);

    expect(screen.getByText(/Alan, Igor/)).toBeInTheDocument();
  });

  it("reports the moves history caused", () => {
    renderDialog(tacticalJustification);

    expect(screen.getByText(/Franklin \(2→3\)/)).toBeInTheDocument();
  });

  it("says so when history changed nothing", () => {
    renderDialog({
      ...tacticalJustification,
      history: { enabled: true, changed_vs_baseline: false, moves: [] },
    });

    expect(
      screen.getByText("peladas.detail.draw_report.history_unchanged"),
    ).toBeInTheDocument();
  });

  it("lists who was left out over capacity", () => {
    renderDialog(tacticalJustification);

    expect(screen.getByText(/Reserva/)).toBeInTheDocument();
  });

  it("hides the benched line when everyone was drawn", () => {
    renderDialog({ ...tacticalJustification, benched: [] });

    expect(
      screen.queryByText(/peladas.detail.draw_report.benched/),
    ).not.toBeInTheDocument();
  });

  it("shows the tactical evidence for the tactical draw", () => {
    renderDialog(tacticalJustification);
    fireEvent.click(screen.getByText("Time 1"));

    expect(screen.getByText(/Alan \+ Felipe \(3\/7\)/)).toBeInTheDocument();
    expect(screen.getByText(/Alan \+ Felipe \(7\/15\)/)).toBeInTheDocument();
    expect(screen.getByText(/Alan → Vitor \(3\)/)).toBeInTheDocument();
  });

  it("falls back to a plain line when a team has no title-winning duo", () => {
    renderDialog(tacticalJustification);
    fireEvent.click(screen.getByText("Time 2"));

    expect(
      screen.getByText("peladas.detail.draw_report.no_champion_pairs"),
    ).toBeInTheDocument();
  });

  it("shows the chemistry evidence for the chemistry draw", () => {
    renderDialog(chemistryJustification);
    fireEvent.click(screen.getByText("Time 1"));

    expect(screen.getByText(/Felipe \(9\)/)).toBeInTheDocument();
    expect(screen.getByText(/Rafa \(4\)/)).toBeInTheDocument();
    expect(screen.getByText(/Felipe \+ Leandro \(17\)/)).toBeInTheDocument();
  });

  it("keeps each draw's metrics apart", () => {
    const { unmount } = renderDialog(tacticalJustification);
    expect(
      screen.getByText("peladas.detail.draw_report.metric.sector_gap"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("peladas.detail.draw_report.metric.defense_gap"),
    ).not.toBeInTheDocument();
    unmount();

    renderDialog(chemistryJustification);
    expect(
      screen.getByText("peladas.detail.draw_report.metric.defense_gap"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("peladas.detail.draw_report.metric.sector_gap"),
    ).not.toBeInTheDocument();
  });

  it("marks history as off when it was not used", () => {
    renderDialog({
      ...tacticalJustification,
      use_history: false,
      history: { enabled: false },
    });

    expect(
      screen.getByText("peladas.detail.draw_report.history_off"),
    ).toBeInTheDocument();
  });

  it("formats grades in the Brazilian style", () => {
    renderDialog(tacticalJustification);

    expect(screen.getByText("8,16")).toBeInTheDocument();
  });

  it("survives a team report with no evidence at all", () => {
    expect(() =>
      renderDialog({
        ...tacticalJustification,
        teams: [
          {
            index: 0,
            name: "Time 1",
            mean: 8,
            formation: "1-1-1",
            players: [player("Solo")],
          },
        ],
      }),
    ).not.toThrow();
  });
});
