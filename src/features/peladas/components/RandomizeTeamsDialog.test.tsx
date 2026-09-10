import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RandomizeTeamsDialog from "./RandomizeTeamsDialog";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe("RandomizeTeamsDialog", () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();

  const renderDialog = (props?: { loading?: boolean }) =>
    render(
      <ThemeContextProvider>
        <RandomizeTeamsDialog
          open
          onClose={onClose}
          onConfirm={onConfirm}
          loading={props?.loading}
        />
      </ThemeContextProvider>,
    );

  // The testid lands on the MUI wrapper; the checked/disabled state is on the
  // input it wraps.
  const historyToggle = () =>
    screen
      .getByTestId("draw-use-history-toggle")
      .querySelector("input") as HTMLInputElement;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers the three algorithms", () => {
    renderDialog();

    expect(screen.getByTestId("draw-algorithm-classic")).toBeInTheDocument();
    expect(screen.getByTestId("draw-algorithm-gemini")).toBeInTheDocument();
    expect(screen.getByTestId("draw-algorithm-gpt")).toBeInTheDocument();
  });

  it("starts on the classic draw so the current behaviour is preserved", () => {
    renderDialog();
    fireEvent.click(screen.getByTestId("confirm-randomize-button"));

    expect(onConfirm).toHaveBeenCalledWith({
      algorithm: "classic",
      useHistory: false,
    });
  });

  it("disables the history switch for the classic draw", () => {
    renderDialog();

    expect(historyToggle()).toBeDisabled();
  });

  it("enables the history switch once a new algorithm is picked", () => {
    renderDialog();
    fireEvent.click(screen.getByTestId("draw-algorithm-gemini"));

    expect(historyToggle()).not.toBeDisabled();
    expect(historyToggle()).toBeChecked();
  });

  it("sends the chemistry flag off when the switch is turned off", () => {
    renderDialog();
    fireEvent.click(screen.getByTestId("draw-algorithm-gpt"));
    fireEvent.click(historyToggle());
    fireEvent.click(screen.getByTestId("confirm-randomize-button"));

    expect(onConfirm).toHaveBeenCalledWith({
      algorithm: "gpt",
      useHistory: false,
    });
  });

  it("never sends history for the classic draw, even after toggling it on", () => {
    renderDialog();
    // Turn history on while a chemistry algorithm is selected...
    fireEvent.click(screen.getByTestId("draw-algorithm-gemini"));
    expect(historyToggle()).toBeChecked();
    // ...then go back to the classic count.
    fireEvent.click(screen.getByTestId("draw-algorithm-classic"));
    fireEvent.click(screen.getByTestId("confirm-randomize-button"));

    expect(onConfirm).toHaveBeenCalledWith({
      algorithm: "classic",
      useHistory: false,
    });
  });

  it("remembers the choice between openings", () => {
    renderDialog();
    fireEvent.click(screen.getByTestId("draw-algorithm-gpt"));
    fireEvent.click(screen.getByTestId("confirm-randomize-button"));
    expect(onConfirm).toHaveBeenLastCalledWith({
      algorithm: "gpt",
      useHistory: true,
    });

    // The dialog stays mounted, so a second draw repeats the last choice.
    fireEvent.click(screen.getByTestId("confirm-randomize-button"));
    expect(onConfirm).toHaveBeenLastCalledWith({
      algorithm: "gpt",
      useHistory: true,
    });
  });

  it("closes itself after confirming", () => {
    renderDialog();
    fireEvent.click(screen.getByTestId("confirm-randomize-button"));

    expect(onClose).toHaveBeenCalled();
  });

  it("blocks confirming while a draw is running", () => {
    renderDialog({ loading: true });

    expect(screen.getByTestId("confirm-randomize-button")).toBeDisabled();
    expect(historyToggle()).toBeDisabled();
  });
});
