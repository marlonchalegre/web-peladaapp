import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserGroupStatsGrid } from "./UserGroupStatsGrid";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

describe("UserGroupStatsGrid", () => {
  it("renders 4 metric blocks with labels and values", () => {
    render(
      <UserGroupStatsGrid
        peladasPlayed={14}
        goals={8}
        assists={5}
        titles={2}
      />,
    );

    expect(screen.getByText("JOGOS")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();

    expect(screen.getByText("GOLS")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();

    expect(screen.getByText("ASSIST.")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    expect(screen.getByText("TÍTULOS")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
