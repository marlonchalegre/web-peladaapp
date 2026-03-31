import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PeladaDetailHeader from "./PeladaDetailHeader";
import TeamsSection from "./TeamsSection";
import type { Pelada, Team } from "../../../shared/api/endpoints";
import { ThemeContextProvider } from "../../../app/providers/ThemeProvider";
import { MemoryRouter } from "react-router-dom";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("Admin Actions Visibility", () => {
  const mockPelada: Pelada = {
    id: 1,
    organization_id: 1,
    status: "open",
  };

  const headerProps = {
    pelada: mockPelada,
    votingInfo: null,
    onStartClick: vi.fn(),
    onExportCsv: vi.fn(),

    onCopyClipboard: vi.fn(),
    onCopyAnnouncement: vi.fn(),
    onToggleFixedGk: vi.fn(),
    onUpdatePlayersPerTeam: vi.fn(),
    onRandomizeTeams: vi.fn(),
    playersPerTeam: 5,

    changingStatus: false,

    processing: false,
  };

  const teamsSectionProps = {
    teams: [] as Team[],
    teamPlayers: {},
    creatingTeam: false,
    onCreateTeam: vi.fn(),
    onDeleteTeam: vi.fn(),
    onDragStartPlayer: vi.fn(),
    dropToTeam: vi.fn(),
    onSetGoalkeeper: vi.fn(),
    onRemovePlayer: vi.fn(),
    scores: {},
  };

  describe("PeladaDetailHeader", () => {
    it("shows Build Schedule button as primary for admins when no plan exists", () => {
      render(
        <MemoryRouter>
          <ThemeContextProvider>
            <PeladaDetailHeader
              {...headerProps}
              pelada={{ ...mockPelada, has_schedule_plan: false }}
              isAdminOverride={true}
            />
          </ThemeContextProvider>
        </MemoryRouter>,
      );
      expect(screen.getByTestId("build-schedule-button")).toBeInTheDocument();
      expect(
        screen.queryByTestId("start-pelada-button"),
      ).not.toBeInTheDocument();
    });

    it("shows Start Pelada button for admins when plan exists", () => {
      render(
        <MemoryRouter>
          <ThemeContextProvider>
            <PeladaDetailHeader
              {...headerProps}
              pelada={{ ...mockPelada, has_schedule_plan: true }}
              isAdminOverride={true}
            />
          </ThemeContextProvider>
        </MemoryRouter>,
      );
      expect(screen.getByTestId("start-pelada-button")).toBeInTheDocument();
    });

    it("hides Start Pelada button for non-admins", () => {
      render(
        <MemoryRouter>
          <ThemeContextProvider>
            <PeladaDetailHeader {...headerProps} isAdminOverride={false} />
          </ThemeContextProvider>
        </MemoryRouter>,
      );
      expect(
        screen.queryByTestId("start-pelada-button"),
      ).not.toBeInTheDocument();
    });

    it("hides Start Pelada button when pelada is already running even for admins", () => {
      render(
        <MemoryRouter>
          <ThemeContextProvider>
            <PeladaDetailHeader
              {...headerProps}
              pelada={{ ...mockPelada, status: "running" }}
              isAdminOverride={true}
            />
          </ThemeContextProvider>
        </MemoryRouter>,
      );
      expect(
        screen.queryByTestId("start-pelada-button"),
      ).not.toBeInTheDocument();
    });

    it("shows Randomize button for admins when open", () => {
      render(
        <MemoryRouter>
          <ThemeContextProvider>
            <PeladaDetailHeader {...headerProps} isAdminOverride={true} />
          </ThemeContextProvider>
        </MemoryRouter>,
      );
      expect(screen.getByTestId("randomize-teams-button")).toBeInTheDocument();
    });
  });

  describe("TeamsSection", () => {
    it("shows nothing special for admins when open (randomize is in header now)", () => {
      render(
        <ThemeContextProvider>
          <TeamsSection
            {...teamsSectionProps}
            locked={false}
            isAdminOverride={true}
          />
        </ThemeContextProvider>,
      );
      expect(
        screen.queryByTestId("randomize-teams-button"),
      ).not.toBeInTheDocument();
    });

    it("hides header randomize button for non-admins", () => {
      render(
        <MemoryRouter>
          <ThemeContextProvider>
            <PeladaDetailHeader
              {...headerProps}
              isAdminOverride={false}
            />
          </ThemeContextProvider>
        </MemoryRouter>,
      );
      expect(
        screen.queryByTestId("randomize-teams-button"),
      ).not.toBeInTheDocument();
    });
  });
});
