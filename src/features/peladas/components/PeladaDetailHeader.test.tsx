import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PeladaDetailHeader from "./PeladaDetailHeader";
import type { Pelada } from "../../../shared/api/endpoints";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import { MemoryRouter } from "react-router-dom";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("PeladaDetailHeader", () => {
  const mockPelada: Pelada = {
    id: 1,
    organization_id: 1,
    status: "open",
    has_schedule_plan: false,
  };

  it("renders Montar Tabela as primary button when no schedule plan exists and user is admin", () => {
    render(
      <MemoryRouter>
        <ThemeContextProvider>
          <PeladaDetailHeader
            pelada={mockPelada}
            votingInfo={null}
            onStartClick={() => {}}
            onCopyClipboard={() => {}}
            onCopyAnnouncement={() => {}}
            onToggleFixedGk={() => {}}
            changingStatus={false}
            processing={false}
            isAdminOverride={true}
          />
        </ThemeContextProvider>
      </MemoryRouter>,
    );

    const buildBtn = screen.getByTestId("build-schedule-button");
    expect(buildBtn).toBeInTheDocument();
    expect(buildBtn).toHaveTextContent("peladas.detail.button.build_schedule");
    // Should NOT show Iniciar Pelada yet
    expect(screen.queryByTestId("start-pelada-button")).not.toBeInTheDocument();
  });

  it("renders Iniciar Pelada and Build Schedule (edit) when schedule plan exists and user is admin", () => {
    render(
      <MemoryRouter>
        <ThemeContextProvider>
          <PeladaDetailHeader
            pelada={{ ...mockPelada, has_schedule_plan: true }}
            votingInfo={null}
            onStartClick={() => {}}
            onCopyClipboard={() => {}}
            onCopyAnnouncement={() => {}}
            onToggleFixedGk={() => {}}
            changingStatus={false}
            processing={false}
            isAdminOverride={true}
          />
        </ThemeContextProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("start-pelada-button")).toBeInTheDocument();
    expect(
      screen.getByTestId("build-schedule-button-edit"),
    ).toBeInTheDocument();
  });

  it("renders Ver Partidas when pelada is NOT open", () => {
    render(
      <MemoryRouter>
        <ThemeContextProvider>
          <PeladaDetailHeader
            pelada={{ ...mockPelada, status: "running" }}
            votingInfo={null}
            onStartClick={() => {}}
            onCopyClipboard={() => {}}
            onCopyAnnouncement={() => {}}
            onToggleFixedGk={() => {}}
            changingStatus={false}
            processing={false}
            isAdminOverride={true}
          />
        </ThemeContextProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByText("peladas.detail.button.view_matches"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("start-pelada-button")).not.toBeInTheDocument();
  });

  it("renders Ver Partidas for non-admin users even if open", () => {
    render(
      <MemoryRouter>
        <ThemeContextProvider>
          <PeladaDetailHeader
            pelada={mockPelada}
            votingInfo={null}
            onStartClick={() => {}}
            onCopyClipboard={() => {}}
            onCopyAnnouncement={() => {}}
            onToggleFixedGk={() => {}}
            changingStatus={false}
            processing={false}
            isAdminOverride={false}
          />
        </ThemeContextProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByText("peladas.detail.button.view_matches"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("start-pelada-button")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("build-schedule-button"),
    ).not.toBeInTheDocument();
  });
});
