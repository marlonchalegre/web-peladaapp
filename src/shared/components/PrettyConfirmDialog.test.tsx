import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import PrettyConfirmDialog from "./PrettyConfirmDialog";
import { ThemeProvider, createTheme } from "@mui/material";

describe("PrettyConfirmDialog", () => {
  const theme = createTheme({
    components: {
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
          disableTouchRipple: true,
        },
      },
    },
  });
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

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={theme}>
        <PrettyConfirmDialog {...defaultProps} />
      </ThemeProvider>,
    );
    await user.click(screen.getByText("common.cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onConfirm when confirm is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={theme}>
        <PrettyConfirmDialog {...defaultProps} />
      </ThemeProvider>,
    );
    await user.click(screen.getByText("common.confirm"));
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
