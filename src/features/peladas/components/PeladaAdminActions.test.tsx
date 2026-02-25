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
    onRandomizeTeams: vi.fn(),
    scores: {},
  };

  describe("PeladaDetailHeader", () => {
    it("shows Start Pelada button for admins", () => {
      render(
        <MemoryRouter>
          <ThemeContextProvider>
            <PeladaDetailHeader {...headerProps} isAdminOverride={true} />
          </ThemeContextProvider>
        </MemoryRouter>
      );
      expect(screen.getByTestId("start-pelada-button")).toBeInTheDocument();
    });

    it("hides Start Pelada button for non-admins", () => {
      render(
        <MemoryRouter>
          <ThemeContextProvider>
            <PeladaDetailHeader {...headerProps} isAdminOverride={false} />
          </ThemeContextProvider>
        </MemoryRouter>
      );
      expect(screen.queryByTestId("start-pelada-button")).not.toBeInTheDocument();
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
        </MemoryRouter>
      );
      expect(screen.queryByTestId("start-pelada-button")).not.toBeInTheDocument();
    });
  });

  describe("TeamsSection", () => {
    it("shows Randomize and Create Team buttons for admins when open", () => {
      render(
        <ThemeContextProvider>
          <TeamsSection {...teamsSectionProps} locked={false} isAdminOverride={true} />
        </ThemeContextProvider>
      );
      expect(screen.getByTestId("randomize-teams-button")).toBeInTheDocument();
      expect(screen.getByTestId("create-team-button")).toBeInTheDocument();
    });

    it("hides Randomize and Create Team buttons for non-admins", () => {
      render(
        <ThemeContextProvider>
          <TeamsSection {...teamsSectionProps} locked={false} isAdminOverride={false} />
        </ThemeContextProvider>
      );
      expect(screen.queryByTestId("randomize-teams-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("create-team-button")).not.toBeInTheDocument();
    });

    it("hides buttons when locked (running/closed) even for admins", () => {
      render(
        <ThemeContextProvider>
          <TeamsSection {...teamsSectionProps} locked={true} isAdminOverride={true} />
        </ThemeContextProvider>
      );
      expect(screen.queryByTestId("randomize-teams-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("create-team-button")).not.toBeInTheDocument();
    });
  });
});
