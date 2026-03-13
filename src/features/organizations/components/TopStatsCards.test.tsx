import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TopStatsCards from "./TopStatsCards";
import { type OrganizationPlayerStats } from "../../../shared/api/endpoints";
import { ThemeProvider, createTheme } from "@mui/material";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const theme = createTheme();

const mockStats: OrganizationPlayerStats[] = [
  {
    player_id: 1,
    player_name: "Marlon",
    goal: 10,
    assist: 2,
    own_goal: 0,
    peladas_played: 5,
    avg_rating: 4.5,
  },
  {
    player_id: 2,
    player_name: "Cicero",
    goal: 5,
    assist: 8,
    own_goal: 0,
    peladas_played: 5,
    avg_rating: 4.8,
  },
];

describe("TopStatsCards", () => {
  it("renders top stats correctly", () => {
    render(
      <ThemeProvider theme={theme}>
        <TopStatsCards stats={mockStats} />
      </ThemeProvider>,
    );

    // Top Scorer should be Marlon (10 goals)
    expect(
      screen.getByText("organizations.stats.cards.top_scorer"),
    ).toBeDefined();
    expect(screen.getByText("Marlon")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();

    // Top Assister should be Cicero (8 assists)
    expect(
      screen.getByText("organizations.stats.cards.top_assister"),
    ).toBeDefined();
    expect(screen.getAllByText("Cicero")).toHaveLength(2);
    expect(screen.getByText("8")).toBeDefined();

    // MVP should be Cicero (4.8 rating)
    expect(screen.getByText("organizations.stats.cards.mvp")).toBeDefined();
    expect(screen.getByText("4.8")).toBeDefined();
  });

  it("renders correctly with empty stats", () => {
    render(
      <ThemeProvider theme={theme}>
        <TopStatsCards stats={[]} />
      </ThemeProvider>,
    );
    expect(
      screen.getByText("organizations.stats.cards.top_scorer"),
    ).toBeDefined();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });
});
