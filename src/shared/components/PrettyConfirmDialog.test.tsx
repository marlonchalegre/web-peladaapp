import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PrettyConfirmDialog from "./PrettyConfirmDialog";
import { ThemeProvider, createTheme } from "@mui/material";

describe("PrettyConfirmDialog", () => {
  const theme = createTheme();
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Confirm Action",
    description: "Are you sure?",
  };

  it("renders correctly when open", () => {
    render(
      <ThemeProvider theme={theme}>
        <PrettyConfirmDialog {...defaultProps} />
      </ThemeProvider>,
    );
    expect(screen.getByText("Confirm Action")).toBeDefined();
    expect(screen.getByText("Are you sure?")).toBeDefined();
  });

  it("calls onClose when cancel is clicked", () => {
    render(
      <ThemeProvider theme={theme}>
        <PrettyConfirmDialog {...defaultProps} />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText("common.cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onConfirm when confirm is clicked", () => {
    render(
      <ThemeProvider theme={theme}>
        <PrettyConfirmDialog {...defaultProps} />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText("common.confirm"));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it("shows loading state on confirm button", () => {
    render(
      <ThemeProvider theme={theme}>
        <PrettyConfirmDialog {...defaultProps} loading={true} />
      </ThemeProvider>,
    );
    expect(
      screen.getByRole("button", { name: "common.confirm" }),
    ).toBeDisabled();
  });
});
