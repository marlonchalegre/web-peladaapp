import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { ThemeContext } from "../../app/providers/ThemeContext";

describe("ThemeSwitcher", () => {
  it("renders light-to-dark toggle button in light mode and calls toggleTheme on click", () => {
    const mockToggleTheme = vi.fn();
    render(
      <ThemeContext.Provider
        value={{ mode: "light", toggleTheme: mockToggleTheme }}
      >
        <ThemeSwitcher />
      </ThemeContext.Provider>,
    );

    const button = screen.getByTestId("theme-switcher");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "common.theme.dark");

    fireEvent.click(button);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("renders dark-to-light toggle button in dark mode with custom data-testid", () => {
    const mockToggleTheme = vi.fn();
    render(
      <ThemeContext.Provider
        value={{ mode: "dark", toggleTheme: mockToggleTheme }}
      >
        <ThemeSwitcher data-testid="custom-switcher" />
      </ThemeContext.Provider>,
    );

    const button = screen.getByTestId("custom-switcher");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "common.theme.light");

    fireEvent.click(button);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});
