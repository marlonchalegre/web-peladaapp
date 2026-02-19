import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
  act,
} from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import OrganizationManagementPage from "./OrganizationManagementPage";
import { api } from "../../../shared/api/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../../app/providers/AuthProvider";

// Mock api client
vi.mock("../../../shared/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    getPaginated: vi.fn(),
    setToken: vi.fn(),
    setAuthErrorHandler: vi.fn(),
  },
}));

// Mock window.confirm
const mockConfirm = vi.fn();
window.confirm = mockConfirm;

describe("OrganizationManagementPage", () => {
  const mockOrg = { id: 1, name: "Test Org" };
  const mockPlayers = [
    {
      id: 101,
      user_id: 1,
      organization_id: 1,
      user_name: "Admin User",
      user_email: "admin@example.com",
    },
    {
      id: 102,
      user_id: 2,
      organization_id: 1,
      user_name: "Player User",
      user_email: "player@example.com",
    },
  ];
  const mockAdmins = [
    {
      id: 201,
      organization_id: 1,
      user_id: 1,
      user_name: "Admin User",
      user_email: "admin@example.com",
    },
  ];
  const mockUsers = [
    { id: 1, name: "Admin User", email: "admin@example.com" },
    { id: 2, name: "Player User", email: "player@example.com" },
    { id: 3, name: "Search User", email: "search@example.com" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);

    vi.mocked(api.get).mockImplementation((url) => {
      if (url === "/api/organizations/1") return Promise.resolve(mockOrg);
      if (url === "/api/organizations/1/players")
        return Promise.resolve(mockPlayers);
      if (url === "/api/organizations/1/admins")
        return Promise.resolve(mockAdmins);
      if (url === "/api/organizations/1/invitations")
        return Promise.resolve([]);
      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });

    vi.mocked(api.getPaginated).mockImplementation((url) => {
      if (url === "/api/users/search") {
        return Promise.resolve({
          data: mockUsers,
          total: mockUsers.length,
          page: 1,
          perPage: 10,
          totalPages: 1,
        });
      }
      return Promise.reject(new Error(`Unhandled getPaginated: ${url}`));
    });
  });

  const renderComponent = async () => {
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/organizations/1/management"]}>
            <Routes>
              <Route
                path="/organizations/:id/management"
                element={<OrganizationManagementPage />}
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>,
      );
    });
    return result;
  };

  it("renders organization details and sections after loading", async () => {
    await renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText("Admin User").length).toBeGreaterThan(0);
      expect(screen.getByText("Player User")).toBeInTheDocument();
    });
  });

  it("handles adding a new admin", async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await renderComponent();

    const selectLabel = await screen.findByLabelText(
      "organizations.dialog.manage_admins.select_user_label",
    );
    await act(async () => {
      fireEvent.mouseDown(selectLabel);
    });

    const option = await screen.findByRole("option", { name: /Player User/ });
    await act(async () => {
      fireEvent.click(option);
    });

    const adminsHeading = screen.getByText(
      "organizations.management.sections.admins",
    );
    const adminsSection = adminsHeading.closest(
      "div.MuiPaper-root",
    ) as HTMLElement;
    const addBtn = within(adminsSection).getByText("common.add");

    await act(async () => {
      fireEvent.click(addBtn);
    });

    expect(api.post).toHaveBeenCalledWith("/api/organizations/1/admins", {
      user_id: 2,
    });
  });

  it("handles adding players flow", async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await renderComponent();
    const addMembersBtn = screen.getAllByText("common.add")[0];

    await act(async () => {
      fireEvent.click(addMembersBtn);
    });

    const dialog = await screen.findByRole("dialog");
    const searchUser = await within(dialog).findByText("Search User");
    const checkbox = searchUser
      .closest("li")
      ?.querySelector("input[type='checkbox']");

    await act(async () => {
      fireEvent.click(checkbox!);
    });

    const addSelectedBtn = within(dialog).getByText(
      /organizations.dialog.add_players.add_selected/,
    );
    await act(async () => {
      fireEvent.click(addSelectedBtn);
    });

    expect(api.post).toHaveBeenCalledWith("/api/players", {
      organization_id: 1,
      user_id: 3,
    });
  });
});
