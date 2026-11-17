import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PeladaFormatSelector, {
  type PeladaFormatSelectorProps,
} from "./PeladaFormatSelector";
import { DEFAULT_PELADA_FORMAT_CONFIG } from "../../../shared/api/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultOrOpts?: string | { defaultValue?: string }) =>
      typeof defaultOrOpts === "string"
        ? defaultOrOpts
        : defaultOrOpts?.defaultValue || key,
  }),
}));

const renderSelector = (overrides: Partial<PeladaFormatSelectorProps> = {}) =>
  render(
    <PeladaFormatSelector
      teamCount={4}
      format="round_robin"
      formatConfig={DEFAULT_PELADA_FORMAT_CONFIG}
      matchesPerTeam={2}
      onFormatChange={vi.fn()}
      onFormatConfigChange={vi.fn()}
      onMatchesPerTeamChange={vi.fn()}
      {...overrides}
    />,
  );

describe("PeladaFormatSelector", () => {
  it("disables championship options when teamCount is below minTeams", () => {
    renderSelector({ teamCount: 2 });

    expect(screen.getByTestId("format-option-winner_stays_on")).toHaveAttribute(
      "aria-disabled",
      "false",
    );
    expect(
      screen.getByTestId("format-option-championship_final"),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByTestId("format-option-championship_semis_final"),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("calls onFormatChange when selecting an enabled format", () => {
    const onFormatChange = vi.fn();
    renderSelector({ onFormatChange });

    fireEvent.click(
      screen.getByTestId("format-option-championship_semis_final"),
    );
    expect(onFormatChange).toHaveBeenCalledWith("championship_semis_final");
  });

  it("renders knockout settings only for championship formats and WSO settings only for winner_stays_on", () => {
    const onFormatConfigChange = vi.fn();
    const { rerender } = renderSelector({
      format: "championship_semis_final",
      onFormatConfigChange,
    });

    expect(
      screen.getByTestId("include-third-place-switch"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("wso-rotation-mode-select"),
    ).not.toBeInTheDocument();

    const thirdPlaceCheckbox = screen
      .getByTestId("include-third-place-switch")
      .querySelector("input");
    if (thirdPlaceCheckbox) {
      fireEvent.click(thirdPlaceCheckbox);
      expect(onFormatConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ include_third_place: true }),
      );
    }

    rerender(
      <PeladaFormatSelector
        teamCount={2}
        format="winner_stays_on"
        formatConfig={DEFAULT_PELADA_FORMAT_CONFIG}
        matchesPerTeam={2}
        onFormatChange={vi.fn()}
        onFormatConfigChange={onFormatConfigChange}
        onMatchesPerTeamChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("wso-rotation-mode-select")).toBeInTheDocument();
    expect(screen.getByTestId("wso-complete-rule-select")).toBeInTheDocument();
    expect(
      screen.queryByTestId("include-third-place-switch"),
    ).not.toBeInTheDocument();
  });
});
