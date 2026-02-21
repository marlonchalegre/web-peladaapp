import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AdminOrganizationsList from "./AdminOrganizationsList";
import { BrowserRouter } from "react-router-dom";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AdminOrganizationsList", () => {
  const mockOrganizations = [
    { id: 1, name: "Org 1", role: "admin" as const },
    { id: 2, name: "Org 2", role: "admin" as const },
  ];
  const mockOnCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders organizations list", () => {
    render(
      <BrowserRouter>
        <AdminOrganizationsList
          organizations={mockOrganizations}
          onCreate={mockOnCreate}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText("Org 1")).toBeInTheDocument();
    expect(screen.getByText("Org 2")).toBeInTheDocument();
    expect(screen.getAllByText("common.roles.admin").length).toBe(2);
  });

  it("navigates to management page when Manage button is clicked", () => {
    render(
      <BrowserRouter>
        <AdminOrganizationsList
          organizations={mockOrganizations}
          onCreate={mockOnCreate}
        />
      </BrowserRouter>,
    );

    const manageButton = screen.getByTestId("manage-org-1");
    fireEvent.click(manageButton);

    expect(mockNavigate).toHaveBeenCalledWith("/organizations/1/management");
    expect(mockNavigate).not.toHaveBeenCalledWith("/organizations/1");
  });

  it("navigates to organization detail page when row is clicked (excluding interactive elements)", () => {
    render(
      <BrowserRouter>
        <AdminOrganizationsList
          organizations={mockOrganizations}
          onCreate={mockOnCreate}
        />
      </BrowserRouter>,
    );

    // Click on the organization name cell (which is inside the row)
    const orgNameCell = screen.getByText("Org 1");
    fireEvent.click(orgNameCell);

    // Should navigate to detail page because the click was on the row but not on a button/link (it was on the text)
    // Wait, the text "Org 1" is inside a Link component. Let's click on a generic cell part.

    const row = orgNameCell.closest("tr");
    if (row) fireEvent.click(row);

    expect(mockNavigate).toHaveBeenCalledWith("/organizations/1");
  });

  it("does not navigate to detail page when Manage button is clicked (event propagation check)", () => {
    render(
      <BrowserRouter>
        <AdminOrganizationsList
          organizations={mockOrganizations}
          onCreate={mockOnCreate}
        />
      </BrowserRouter>,
    );

    const manageButton = screen.getByTestId("manage-org-1");
    fireEvent.click(manageButton);

    // Should ONLY have called navigate for management
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/organizations/1/management");
    expect(mockNavigate).not.toHaveBeenCalledWith("/organizations/1");
  });

  it("calls onCreate when create button is clicked", () => {
    render(
      <BrowserRouter>
        <AdminOrganizationsList
          organizations={mockOrganizations}
          onCreate={mockOnCreate}
        />
      </BrowserRouter>,
    );

    const createButton = screen.getByTestId("create-org-open-dialog");
    fireEvent.click(createButton);

    expect(mockOnCreate).toHaveBeenCalled();
  });
});
