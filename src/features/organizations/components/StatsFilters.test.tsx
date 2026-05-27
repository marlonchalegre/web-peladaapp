import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StatsFilters from "./StatsFilters";
import { ThemeProvider, createTheme } from "@mui/material";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const theme = createTheme();

describe("StatsFilters", () => {
  const defaultProps = {
    nameFilter: "",
    onNameFilterChange: vi.fn(),
    minPeladas: "",
    onMinPeladasChange: vi.fn(),
    minGoals: "",
    onMinGoalsChange: vi.fn(),
    minAssists: "",
    onMinAssistsChange: vi.fn(),
    year: 2024,
    onYearChange: vi.fn(),
    years: ["2024", "2023", "2022"],
  };

  it("renders correctly with default values", () => {
    render(
      <ThemeProvider theme={theme}>
        <StatsFilters {...defaultProps} />
      </ThemeProvider>,
    );

    expect(screen.getByText("common.filters")).toBeDefined();
    expect(
      screen.getByPlaceholderText("common.fields.player_name"),
    ).toBeDefined();
  });

  it("does not toggle collapse state when clicking the year selector dropdown", () => {
    const onYearChange = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <StatsFilters {...defaultProps} onYearChange={onYearChange} />
      </ThemeProvider>,
    );

    // Get the year select input (MUI select renders role="combobox" for the select trigger)
    const yearSelect = screen.getByRole("combobox");
    expect(yearSelect).toBeDefined();

    // Click the year select
    fireEvent.click(yearSelect);

    // Verify it doesn't trigger the collapse/expanded toggle (the year selector should function independently)
    // We can also verify that the year select is distinct and isolated from the filters-header element
    const header = screen.getByTestId("filters-header");

    // We check that filters-header element is not an ancestor of the yearSelect combobox.
    // This physically guarantees no bubbling path from yearSelect to filters-header click handler.
    expect(header.contains(yearSelect)).toBe(false);
  });
});
