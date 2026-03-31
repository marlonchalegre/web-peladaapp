import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
            onUpdatePlayersPerTeam={() => {}}
            onRandomizeTeams={() => {}}
            playersPerTeam={5}
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
            onUpdatePlayersPerTeam={() => {}}
            onRandomizeTeams={() => {}}
            playersPerTeam={5}
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
            onUpdatePlayersPerTeam={() => {}}
            onRandomizeTeams={() => {}}
            playersPerTeam={5}
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

  it("hides Ver Partidas for non-admin users when open", () => {
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
            onUpdatePlayersPerTeam={() => {}}
            onRandomizeTeams={() => {}}
            playersPerTeam={5}
            changingStatus={false}
            processing={false}
            isAdminOverride={false}
          />
        </ThemeContextProvider>
      </MemoryRouter>,
    );

    expect(
      screen.queryByText("peladas.detail.button.view_matches"),
    ).not.toBeInTheDocument();
  });

  it("renders Ver Partidas for non-admin users when running", () => {
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
            onUpdatePlayersPerTeam={() => {}}
            onRandomizeTeams={() => {}}
            playersPerTeam={5}
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
  });

  it("hides Manage Voting button when status is open even for admin", () => {
    render(
      <MemoryRouter>
        <ThemeContextProvider>
          <PeladaDetailHeader
            pelada={{ ...mockPelada, is_admin: true }}
            votingInfo={null}
            onStartClick={() => {}}
            onCopyClipboard={() => {}}
            onCopyAnnouncement={() => {}}
            onToggleFixedGk={() => {}}
            onUpdatePlayersPerTeam={() => {}}
            onRandomizeTeams={() => {}}
            playersPerTeam={5}
            changingStatus={false}
            processing={false}
          />
        </ThemeContextProvider>
      </MemoryRouter>,
    );

    expect(
      screen.queryByText("peladas.detail.button.manage_voting"),
    ).not.toBeInTheDocument();
  });

  it("shows Manage Voting button when status is NOT open for admin", () => {
    render(
      <MemoryRouter>
        <ThemeContextProvider>
          <PeladaDetailHeader
            pelada={{ ...mockPelada, status: "closed", is_admin: true }}
            votingInfo={null}
            onStartClick={() => {}}
            onCopyClipboard={() => {}}
            onCopyAnnouncement={() => {}}
            onToggleFixedGk={() => {}}
            onUpdatePlayersPerTeam={() => {}}
            onRandomizeTeams={() => {}}
            playersPerTeam={5}
            changingStatus={false}
            processing={false}
          />
        </ThemeContextProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByText("peladas.detail.button.manage_voting"),
    ).toBeInTheDocument();
  });

  it("calls onUpdatePlayersPerTeam when stepper buttons are clicked", () => {
    const onUpdate = vi.fn();
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
            onUpdatePlayersPerTeam={onUpdate}
            onRandomizeTeams={() => {}}
            playersPerTeam={5}
            changingStatus={false}
            processing={false}
            isAdminOverride={true}
          />
        </ThemeContextProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("5")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("players-per-team-increment"));
    expect(onUpdate).toHaveBeenCalledWith(6);

    fireEvent.click(screen.getByTestId("players-per-team-decrement"));
    expect(onUpdate).toHaveBeenCalledWith(4);
  });
  it("calls onRandomizeTeams when randomize button is clicked", () => {
    const onRandomize = vi.fn();
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
            onUpdatePlayersPerTeam={() => {}}
            onRandomizeTeams={onRandomize}
            playersPerTeam={5}
            changingStatus={false}
            processing={false}
            isAdminOverride={true}
          />
        </ThemeContextProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId("randomize-teams-button"));
    expect(onRandomize).toHaveBeenCalled();
  });
});
