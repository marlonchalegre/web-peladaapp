import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, type Mock } from "vitest";
import StatsTable from "./StatsTable";
import { type OrganizationPlayerStats } from "../../../shared/api/endpoints";
import { ThemeProvider, createTheme } from "@mui/material";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      if (key.includes("common.positions")) {
        return options?.defaultValue || key.split(".").pop() || "";
      }
      return key;
    },
  }),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const theme = createTheme();

const mockStats: OrganizationPlayerStats[] = [
  {
    player_id: 1,
    player_name: "Marlon",
    player_position: "Atacante",
    goal: 10,
    assist: 2,
    own_goal: 0,
    peladas_played: 5,
    avg_rating: 4.5,
  },
];

describe("StatsTable", () => {
  it("renders desktop view correctly", () => {
    // Force desktop view
    (window.matchMedia as Mock).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider theme={theme}>
        <StatsTable
          stats={mockStats}
          orderBy="player_name"
          order="asc"
          onSort={() => {}}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("Marlon")).toBeDefined();
    expect(screen.getByText("Atacante")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
  });

  it("renders mobile view correctly", () => {
    // Force mobile view
    (window.matchMedia as Mock).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider theme={theme}>
        <StatsTable
          stats={mockStats}
          orderBy="player_name"
          order="asc"
          onSort={() => {}}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("Marlon")).toBeDefined();
    expect(screen.getByText("Atacante")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
  });

  it("renders empty state correctly", () => {
    render(
      <ThemeProvider theme={theme}>
        <StatsTable
          stats={[]}
          orderBy="player_name"
          order="asc"
          onSort={() => {}}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("organizations.stats.empty")).toBeDefined();
  });
});
