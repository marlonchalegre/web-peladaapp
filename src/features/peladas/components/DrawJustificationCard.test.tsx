import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DrawJustificationCard from "./DrawJustificationCard";
import type {
  DrawChemistryJustification,
  DrawTacticalJustification,
} from "../../../shared/api/endpoints";

const chemistryJustification: DrawChemistryJustification = {
  algorithm: "gemini",
  source: "board",
  players_considered: 10,
  use_history: false,
  history: { enabled: false },
  benched: [{ name: "Felipe M.", grade: 6.5 }],
  teams: [],
  metrics: {
    squad_mean: 7.42,
    overall_gap: 0.15,
    defense_gap: 0.1,
    offense_gap: 0.2,
  },
};

const tacticalJustification: DrawTacticalJustification = {
  algorithm: "gpt",
  source: "board",
  players_considered: 10,
  use_history: false,
  history: { enabled: false },
  benched: [],
  teams: [],
  metrics: {
    squad_mean: 7.1,
    team_mean_gap: 0.32,
    sector_gap: 0.4,
  },
};

describe("DrawJustificationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the classic chip when there is no justification", () => {
    render(<DrawJustificationCard justification={null} />);
    expect(
      screen.getByText("peladas.draw.justification.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("peladas.draw.justification.chip_classic"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("peladas.draw.justification.view_full"),
    ).not.toBeInTheDocument();
  });

  it("does not render team average balance row when teamAverages is empty", () => {
    render(<DrawJustificationCard justification={null} teamAverages={[]} />);
    expect(
      screen.queryByText(/peladas\.draw\.justification\.team_avg_balance/),
    ).not.toBeInTheDocument();
  });

  it("renders the gemini chip and chemistry metrics", () => {
    render(
      <DrawJustificationCard
        justification={chemistryJustification}
        teamAverages={[
          { name: "Time 1", avg: 7.6, count: 5 },
          { name: "Time 2", avg: 7.2, count: 5 },
        ]}
      />,
    );
    expect(
      screen.getByText("peladas.draw.justification.chip_gemini"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("peladas.draw.justification.squad_mean"),
    ).toBeInTheDocument();
    expect(screen.getByText("7,42")).toBeInTheDocument();
    expect(
      screen.getByText("peladas.draw.justification.gap_overall"),
    ).toBeInTheDocument();
    expect(screen.getByText("0,150")).toBeInTheDocument();
    expect(
      screen.getByText("peladas.draw.justification.gap_defense"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("peladas.draw.justification.gap_attack"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("peladas.draw.justification.team_avg_balance"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("peladas.draw.justification.view_full"),
    ).not.toBeInTheDocument();
  });

  it("renders the GPT chip and tactical metrics", () => {
    render(<DrawJustificationCard justification={tacticalJustification} />);
    expect(
      screen.getByText("peladas.draw.justification.chip_gpt"),
    ).toBeInTheDocument();
    expect(screen.getByText("7,10")).toBeInTheDocument();
    expect(screen.getByText("0,320")).toBeInTheDocument();
    expect(
      screen.getByText("peladas.draw.justification.gap_sector"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("peladas.draw.justification.gap_defense"),
    ).not.toBeInTheDocument();
  });

  it("lists benched players waiting for a slot", () => {
    render(<DrawJustificationCard justification={chemistryJustification} />);
    expect(
      screen.getByText("peladas.draw.justification.benched_text"),
    ).toBeInTheDocument();
  });

  it("warns about incomplete teams when a team is below playersPerTeam", () => {
    render(
      <DrawJustificationCard
        justification={chemistryJustification}
        playersPerTeam={5}
        teamAverages={[{ name: "Time 1", avg: 7.5, count: 3 }]}
      />,
    );
    expect(
      screen.getByText("peladas.draw.justification.incomplete_teams"),
    ).toBeInTheDocument();
  });

  it("invokes onOpenDialog from the full-justification button", () => {
    const onOpenDialog = vi.fn();
    render(
      <DrawJustificationCard
        justification={chemistryJustification}
        onOpenDialog={onOpenDialog}
      />,
    );
    fireEvent.click(screen.getByText("peladas.draw.justification.view_full"));
    expect(onOpenDialog).toHaveBeenCalledTimes(1);
  });

  it("shows the heuristic disclaimer", () => {
    render(<DrawJustificationCard justification={null} />);
    expect(
      screen.getByText("peladas.draw.justification.heuristic_caveat"),
    ).toBeInTheDocument();
  });
});
