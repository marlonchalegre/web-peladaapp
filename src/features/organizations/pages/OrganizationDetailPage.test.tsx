import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import OrganizationDetailPage from "./OrganizationDetailPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

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
    user: {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      admin_orgs: ["1"],
    },
    isAuthenticated: true,
  }),
}));

import { api } from "../../../shared/api/client";

describe("OrganizationDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders organization details and paginated peladas", async () => {
    const mockOrg = { id: "1", name: "Test Org", owner_id: "1" };
    const mockPeladas = {
      data: [
        { id: "1", organization_id: "1", status: "open" },
        { id: "2", organization_id: "1", status: "closed" },
      ],
      total: 25,
      page: 1,
      perPage: 10,
      totalPages: 3,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/1"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Test Org").length).toBeGreaterThan(0);
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
    const mockOrg = { id: "1", name: "Test Org", owner_id: "1" };
    const mockPeladasPage1 = {
      data: [{ id: "1", organization_id: "1", status: "open" }],
      total: 25,
      page: 1,
      perPage: 10,
      totalPages: 3,
    };
    const mockPeladasPage2 = {
      data: [{ id: "11", organization_id: "1", status: "open" }],
      total: 25,
      page: 2,
      perPage: 10,
      totalPages: 3,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/1"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
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
    const mockOrg = { id: "1", name: "Test Org", owner_id: "1" };
    const mockPeladas = {
      data: [],
      total: 0,
      page: 1,
      perPage: 10,
      totalPages: 0,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    const createdPelada = { id: "99", organization_id: "1" };
    (api.post as Mock).mockImplementation((path: string) => {
      if (path === "/api/peladas") return Promise.resolve(createdPelada);
      if (path === "/api/teams") return Promise.resolve({ id: "500" });
      return Promise.reject(new Error("Unexpected post"));
    });

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/1"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
            <Route
              path="/peladas/99/attendance"
              element={<div>Pelada Detail Page</div>}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
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

  it("shows leave organization button for non-admin players and opens confirmation dialog", async () => {
    const mockOrg = { id: "2", name: "Non-Admin Org" };
    const mockPeladas = {
      data: [],
      total: 0,
      page: 1,
      perPage: 10,
      totalPages: 0,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/2") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/2/admins") return Promise.resolve([]); // Not an admin
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/2/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/2"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Non-Admin Org").length).toBeGreaterThan(0);
    });

    // Button should be present for non-admins
    const leaveButton = screen.getByTestId("leave-org-button");
    expect(leaveButton).toBeInTheDocument();

    // Click leave button to open dialog
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(
        screen.getByText("organizations.detail.leave_dialog.title"),
      ).toBeInTheDocument();
    });

    // Mock leave API call
    (api.post as Mock).mockResolvedValueOnce({});

    // Click confirm in dialog
    const confirmButton = screen.getByText("common.actions.confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/organizations/2/leave", {});
    });
  });

  it("does not show leave organization button for admins", async () => {
    const mockOrg = { id: "1", name: "Admin Org" };
    const mockPeladas = {
      data: [],
      total: 0,
      page: 1,
      perPage: 10,
      totalPages: 0,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/admins")
        return Promise.resolve([{ user_id: "1", organization_id: "1" }]); // User is admin
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/1"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Admin Org").length).toBeGreaterThan(0);
    });

    // Leave button should NOT be present for admins
    expect(screen.queryByTestId("leave-org-button")).not.toBeInTheDocument();
  });

  it("handles leaveOrganization failure with Error object", async () => {
    const mockOrg = { id: "2", name: "Non-Admin Org" };
    const mockPeladas = {
      data: [],
      total: 0,
      page: 1,
      perPage: 10,
      totalPages: 0,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/2") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/2/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/2/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/2"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Non-Admin Org").length).toBeGreaterThan(0);
    });

    const leaveButton = screen.getByTestId("leave-org-button");
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(screen.getByText("organizations.detail.leave_dialog.title")).toBeInTheDocument();
    });

    // Mock leave API call to reject with Error
    (api.post as Mock).mockRejectedValueOnce(new Error("Custom Error Message"));

    const confirmButton = screen.getByText("common.actions.confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText("Custom Error Message")).toBeInTheDocument();
    });
  });

  it("handles leaveOrganization failure with raw rejection (string)", async () => {
    const mockOrg = { id: "2", name: "Non-Admin Org" };
    const mockPeladas = {
      data: [],
      total: 0,
      page: 1,
      perPage: 10,
      totalPages: 0,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/2") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/2/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/2/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/2"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Non-Admin Org").length).toBeGreaterThan(0);
    });

    const leaveButton = screen.getByTestId("leave-org-button");
    fireEvent.click(leaveButton);

    // Mock leave API call to reject with string
    (api.post as Mock).mockRejectedValueOnce("some raw string error");

    const confirmButton = screen.getByText("common.actions.confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText("organizations.detail.error.leave_failed")).toBeInTheDocument();
    });
  });

  it("allows cancelling leave organization dialog", async () => {
    const mockOrg = { id: "2", name: "Non-Admin Org" };
    const mockPeladas = {
      data: [],
      total: 0,
      page: 1,
      perPage: 10,
      totalPages: 0,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/2") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/2/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/2/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/2"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Non-Admin Org").length).toBeGreaterThan(0);
    });

    const leaveButton = screen.getByTestId("leave-org-button");
    fireEvent.click(leaveButton);

    await waitFor(() => {
      expect(screen.getByText("organizations.detail.leave_dialog.title")).toBeInTheDocument();
    });

    // Click Cancel button
    const cancelButton = screen.getByText("common.actions.cancel");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("organizations.detail.leave_dialog.title")).not.toBeInTheDocument();
    });
  });

  it("handles failed createPelada API call and displays error banner", async () => {
    const mockOrg = { id: "1", name: "Test Org", owner_id: "1" };
    const mockPeladas = {
      data: [],
      total: 0,
      page: 1,
      perPage: 10,
      totalPages: 0,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/admins") return Promise.resolve([]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    // Mock createPelada to fail with Error
    (api.post as Mock).mockRejectedValueOnce(new Error("Failed to create pelada"));

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/1"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("organizations.detail.section.new_pelada")).toBeInTheDocument();
    });

    const createButton = screen.getByText("organizations.form.pelada.submit");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to create pelada")).toBeInTheDocument();
    });
  });

  it("handles deletePelada successfully and refetches peladas list", async () => {
    const mockOrg = { id: "1", name: "Test Org", owner_id: "1" };
    const mockPeladas = {
      data: [
        { id: "10", organization_id: "1", status: "open" },
      ],
      total: 1,
      page: 1,
      perPage: 10,
      totalPages: 1,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/admins") return Promise.resolve([{ user_id: "1" }]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    (api.delete as Mock).mockResolvedValueOnce({});

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/1"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Test Org").length).toBeGreaterThan(0);
    });

    const deleteBtn = screen.getByLabelText("organizations.peladas.aria.delete");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/api/peladas/10");
      expect(api.getPaginated).toHaveBeenCalledTimes(2);
    });
  });

  it("handles deletePelada failure and displays error banner", async () => {
    const mockOrg = { id: "1", name: "Test Org", owner_id: "1" };
    const mockPeladas = {
      data: [
        { id: "10", organization_id: "1", status: "open" },
      ],
      total: 1,
      page: 1,
      perPage: 10,
      totalPages: 1,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/admins") return Promise.resolve([{ user_id: "1" }]);
      return Promise.reject(new Error(`Not found: ${path}`));
    });
    (api.getPaginated as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1/peladas")
        return Promise.resolve(mockPeladas);
      return Promise.reject(new Error("Not found"));
    });

    (api.delete as Mock).mockRejectedValueOnce(new Error("Failed to delete pelada"));

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/1"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Test Org").length).toBeGreaterThan(0);
    });

    const deleteBtn = screen.getByLabelText("organizations.peladas.aria.delete");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/api/peladas/10");
      expect(screen.getByText("Failed to delete pelada")).toBeInTheDocument();
    });
  });

  it("handles fetchPeladas failure with Error object", async () => {
    const mockOrg = { id: "1", name: "Test Org", owner_id: "1" };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/admins") return Promise.resolve([]);
      return Promise.reject(new Error("Not found"));
    });
    (api.getPaginated as Mock).mockRejectedValueOnce(new Error("Peladas fetch failed"));

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/1"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Peladas fetch failed")).toBeInTheDocument();
    });
  });

  it("handles fetchPeladas failure with raw string", async () => {
    const mockOrg = { id: "1", name: "Test Org", owner_id: "1" };
    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/admins") return Promise.resolve([]);
      return Promise.reject(new Error("Not found"));
    });
    (api.getPaginated as Mock).mockRejectedValueOnce("raw string failure");

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/1"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("organizations.detail.error.load_peladas_failed")).toBeInTheDocument();
    });
  });

  it("does not close leave dialog when isLeaving is true", async () => {
    const mockOrg = { id: "2", name: "Non-Admin Org" };
    const mockPeladas = { data: [], total: 0, page: 1, perPage: 10, totalPages: 0 };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/2") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/2/admins") return Promise.resolve([]);
      return Promise.reject(new Error("Not found"));
    });
    (api.getPaginated as Mock).mockResolvedValue(mockPeladas);

    // Mock leave API to return a pending promise that never resolves
    let resolveLeavePromise: any;
    const leavePromise = new Promise((resolve) => {
      resolveLeavePromise = resolve;
    });
    (api.post as Mock).mockReturnValueOnce(leavePromise);

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/2"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Non-Admin Org").length).toBeGreaterThan(0);
    });

    // Open leave dialog
    fireEvent.click(screen.getByTestId("leave-org-button"));
    await waitFor(() => {
      expect(screen.getByText("organizations.detail.leave_dialog.title")).toBeInTheDocument();
    });

    // Confirm to trigger leave (which is pending)
    fireEvent.click(screen.getByText("common.actions.confirm"));

    // Now it is leaving. Try pressing Escape key on the dialog container
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });

    // Dialog should still be open
    expect(screen.getByText("organizations.detail.leave_dialog.title")).toBeInTheDocument();

    // Now resolve the promise so the test doesn't leak/hang
    await act(async () => {
      resolveLeavePromise({});
    });
  });

  it("handles rows per page change", async () => {
    const mockOrg = { id: "1", name: "Test Org", owner_id: "1" };
    const mockPeladas = {
      data: [{ id: "1", organization_id: "1", status: "open" }],
      total: 25,
      page: 1,
      perPage: 10,
      totalPages: 3,
    };

    (api.get as Mock).mockImplementation((path: string) => {
      if (path === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (path === "/api/organizations/1/admins") return Promise.resolve([]);
      return Promise.reject(new Error("Not found"));
    });
    (api.getPaginated as Mock).mockResolvedValue(mockPeladas);

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MemoryRouter initialEntries={["/organizations/1"]}>
          <Routes>
            <Route
              path="/organizations/:id"
              element={<OrganizationDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("organizations.peladas.item_name").length).toBeGreaterThan(0);
    });

    // Find and change rows per page
    const select = screen.getByRole("combobox", { name: "common.pagination.rows_per_page" });
    fireEvent.mouseDown(select);
    const option = screen.getByRole("option", { name: "25" });
    fireEvent.click(option);

    await waitFor(() => {
      expect(api.getPaginated).toHaveBeenLastCalledWith(
        "/api/organizations/1/peladas",
        expect.objectContaining({ per_page: 25, page: 1 }),
      );
    });
  });
});
