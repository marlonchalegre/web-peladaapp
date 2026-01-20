import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OrganizationDetailPage from "./OrganizationDetailPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// Mock the API client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
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

import { api } from "../../../shared/api/client";

describe("OrganizationDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders organization details and paginated peladas", async () => {
    const mockOrg = { id: 1, name: "Test Org" };
    const mockPeladas = {
      data: [
        { id: 1, organization_id: 1, status: "open" },
        { id: 2, organization_id: 1, status: "closed" },
      ],
      total: 25,
      page: 1,
      perPage: 10,
      totalPages: 3,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/users/1/is-admin")
        return Promise.resolve({ is_admin: true });
      return Promise.reject(new Error("Not found"));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    render(
      <MemoryRouter initialEntries={["/organizations/1"]}>
        <Routes>
          <Route
            path="/organizations/:id"
            element={<OrganizationDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test Org")).toBeInTheDocument();
      // Pelada #1 -> organizations.peladas.item_name with simple mock
      const items = screen.getAllByText("organizations.peladas.item_name");
      expect(items.length).toBeGreaterThan(0);
    });

    // Check pagination info
    // Pagination text comes from MUI TablePagination component which might not be fully using my i18n keys for "1-10 of 25" unless configured.
    // MUI uses its own localization.
    expect(screen.getByText("1–10 of 25")).toBeInTheDocument();
  });

  it("handles page change", async () => {
    const mockOrg = { id: 1, name: "Test Org" };
    const mockPeladasPage1 = {
      data: [{ id: 1, organization_id: 1, status: "open" }],
      total: 25,
      page: 1,
      perPage: 10,
      totalPages: 3,
    };
    const mockPeladasPage2 = {
      data: [{ id: 11, organization_id: 1, status: "open" }],
      total: 25,
      page: 2,
      perPage: 10,
      totalPages: 3,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/users/1/is-admin")
        return Promise.resolve({ is_admin: true });
      return Promise.reject(new Error("Not found"));
    });
    (api.getPaginated as Mock).mockImplementation(
      (path: string, params: { page: number }) => {
        if (path === "/api/organizations/1/peladas") {
          if (params.page === 2) return Promise.resolve(mockPeladasPage2);
          return Promise.resolve(mockPeladasPage1);
        }
        return Promise.reject(new Error("Not found"));
      },
    );

    render(
      <MemoryRouter initialEntries={["/organizations/1"]}>
        <Routes>
          <Route
            path="/organizations/:id"
            element={<OrganizationDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getAllByText("organizations.peladas.item_name").length,
      ).toBeGreaterThan(0);
    });

    // Click next page button
    const nextButton = screen.getByTitle("Go to next page");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getAllByText("organizations.peladas.item_name").length,
      ).toBeGreaterThan(0);
    });
  });

  it("creates teams and redirects after creating a pelada", async () => {
    const mockOrg = { id: 1, name: "Test Org" };
    const mockPeladas = {
      data: [],
      total: 0,
      page: 1,
      perPage: 10,
      totalPages: 0,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/users/1/is-admin")
        return Promise.resolve({ is_admin: true });
      return Promise.reject(new Error("Not found"));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    const createdPelada = { id: 99, organization_id: 1 };
    (api.post as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas") return Promise.resolve(createdPelada);
      if (path === "/api/teams") return Promise.resolve({ id: 500 });
      return Promise.reject(new Error("Unexpected post"));
    });

    render(
      <MemoryRouter initialEntries={["/organizations/1"]}>
        <Routes>
          <Route
            path="/organizations/:id"
            element={<OrganizationDetailPage />}
          />
          <Route path="/peladas/99" element={<div>Pelada Detail Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("organizations.detail.section.new_pelada"),
      ).toBeInTheDocument();
    });

    // Fill and submit form
    // The form is in CreatePeladaForm component
    const createButton = screen.getByText("organizations.form.pelada.submit");
    fireEvent.click(createButton);

    await waitFor(() => {
      // Should have called createPelada once
      expect(api.post).toHaveBeenCalledWith("/api/peladas", expect.any(Object));
      // createTeam should NOT be called by the frontend anymore
      expect(api.post).not.toHaveBeenCalledWith(
        "/api/teams",
        expect.any(Object),
      );

      // Should have redirected
      expect(screen.getByText("Pelada Detail Page")).toBeInTheDocument();
    });
  });
});
