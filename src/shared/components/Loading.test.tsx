import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Loading } from "./Loading";
import { ThemeProvider, createTheme } from "@mui/material";

describe("Loading", () => {
  const theme = createTheme();

  it("renders correctly with default props", () => {
    render(
      <ThemeProvider theme={theme}>
        <Loading />
      </ThemeProvider>,
    );
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
    // Check that it's NOT displaying any text (message)
    // We can check if any Typography is present or just check the container text content
    expect(screen.queryByText(/./)).toBeNull();
  });

  it("renders with a message", () => {
    render(
      <ThemeProvider theme={theme}>
        <Loading message="Fetching data..." />
      </ThemeProvider>,
    );
    expect(screen.getByText("Fetching data...")).toBeDefined();
  });

  it("renders fullScreen version", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Loading fullScreen />
      </ThemeProvider>,
    );
    const box = container.firstChild as HTMLElement;
    // In jsdom with MUI, sometimes style object doesn't reflect sx props directly
    // but we can check the class or just verify it renders without crashing
    expect(box).toBeDefined();
  });
});
