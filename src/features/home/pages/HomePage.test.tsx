import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import HomePage from "./HomePage";
import { MemoryRouter } from "react-router-dom";
import { api } from "../../../shared/api/client";

// Mock the API client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock("../../../app/providers/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Test User", email: "test@example.com" },
    isAuthenticated: true,
  }),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists organizations where user is admin or player", async () => {
    // Mock user organizations
    const mockUserOrgs = [
      { id: 101, name: "Org Admin", role: "admin" },
      { id: 102, name: "Org Player", role: "player" },
    ];

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/users/1/organizations")
        return Promise.resolve(mockUserOrgs);
      return Promise.resolve([]);
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Org Admin")).toBeInTheDocument();
      expect(screen.getByText("Org Player")).toBeInTheDocument();
    });

    // Check role labels
    expect(screen.getByText("common.roles.admin")).toBeInTheDocument();
    expect(screen.getByText("common.roles.player")).toBeInTheDocument();
  });

  it("renders empty state messages when user has no organizations", async () => {
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/users/1/organizations") return Promise.resolve([]);
      return Promise.resolve([]);
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("home.sections.admin_orgs.empty"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("home.sections.member_orgs.empty"),
      ).toBeInTheDocument();
    });
  });
});
