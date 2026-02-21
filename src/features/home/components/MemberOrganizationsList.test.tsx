import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MemberOrganizationsList from "./MemberOrganizationsList";
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

describe("MemberOrganizationsList", () => {
  const mockOrganizations = [{ id: 1, name: "Org 1", role: "player" as const }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders organizations list", () => {
    render(
      <BrowserRouter>
        <MemberOrganizationsList organizations={mockOrganizations} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Org 1")).toBeInTheDocument();
    expect(screen.getByText("common.roles.player")).toBeInTheDocument();
  });

  it("navigates to organization detail page when row is clicked", () => {
    render(
      <BrowserRouter>
        <MemberOrganizationsList organizations={mockOrganizations} />
      </BrowserRouter>,
    );

    const row = screen.getByText("Org 1").closest("tr");
    if (row) fireEvent.click(row);

    expect(mockNavigate).toHaveBeenCalledWith("/organizations/1");
  });

  it("navigates to organization detail page ONLY once when Link is clicked (propagation test)", () => {
    render(
      <BrowserRouter>
        <MemberOrganizationsList organizations={mockOrganizations} />
      </BrowserRouter>,
    );

    const link = screen.getByText("Org 1");
    fireEvent.click(link);

    // Link has to={`/organizations/1`} (processed by RouterLink)
    // TableRow has onClick={() => navigate(`/organizations/1`)}
    // Link has onClick={(e) => e.stopPropagation()}
    // TableRow has safeguard: if (e.target.closest("button, a")) return;

    // In this test environment, the Link will trigger navigate via its `to` prop (internally in react-router-dom)
    // AND the TableRow's onClick would trigger mockNavigate IF the safeguard didn't work.

    // So if the safeguard works, mockNavigate should NOT be called at all by the TableRow.
    // The navigation for the link itself is handled by the Link component's default behavior, not our mockNavigate.

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
