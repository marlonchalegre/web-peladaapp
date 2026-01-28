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
    getPaginated: vi.fn(),
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

  it("renders peladas with correct links based on status", async () => {
    // Mock user organizations (required for initial load) via generic get
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/users/1/organizations") {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    // Mock peladas via getPaginated
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/users/1/peladas") {
        return Promise.resolve({
          data: [
            {
              id: 1,
              status: "open",
              scheduled_at: "2023-01-01T10:00:00Z",
              organization_name: "Org 1",
            },
            {
              id: 2,
              status: "running",
              scheduled_at: "2023-01-02T10:00:00Z",
              organization_name: "Org 1",
            },
            {
              id: 3,
              status: "closed",
              scheduled_at: "2023-01-03T10:00:00Z",
              organization_name: "Org 1",
            },
            {
              id: 4,
              status: "voting",
              scheduled_at: "2023-01-04T10:00:00Z",
              organization_name: "Org 1",
            },
            {
              id: 5,
              status: "attendance",
              scheduled_at: "2023-01-05T10:00:00Z",
              organization_name: "Org 1",
            },
          ],
          total: 5,
          page: 1,
          perPage: 5,
          totalPages: 1,
        });
      }
      return Promise.resolve({
        data: [],
        total: 0,
        page: 1,
        perPage: 10,
        totalPages: 0,
      });
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
    });

    const links = screen.getAllByRole("link");
    // We expect 5 pelada links. Note: There might be other links (e.g. "Create Organization" if button is a link, but it's a button).
    // The table cells contain the links.

    // The links are rendered in the order of the table rows
    // Filter links that match /peladas/
    const peladaLinks = links.filter((l) =>
      l.getAttribute("href")?.startsWith("/peladas/"),
    );

    expect(peladaLinks[0]).toHaveAttribute("href", "/peladas/1/matches"); // Open
    expect(peladaLinks[1]).toHaveAttribute("href", "/peladas/2/matches"); // Running
    expect(peladaLinks[2]).toHaveAttribute("href", "/peladas/3/matches"); // Closed
    expect(peladaLinks[3]).toHaveAttribute("href", "/peladas/4/voting"); // Voting
    expect(peladaLinks[4]).toHaveAttribute("href", "/peladas/5/attendance"); // Attendance
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
