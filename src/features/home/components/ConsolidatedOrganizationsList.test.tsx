import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConsolidatedOrganizationsList from "./ConsolidatedOrganizationsList";
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

// Mock useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ConsolidatedOrganizationsList", () => {
  const mockAdminOrgs = [
    { id: "101", name: "Org Admin A", role: "admin" as const },
  ];
  const mockMemberOrgs = [
    { id: "102", name: "Org Member B", role: "player" as const },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders both admin and member organizations in a consolidated view", () => {
    render(
      <BrowserRouter>
        <ConsolidatedOrganizationsList
          adminOrgs={mockAdminOrgs}
          memberOrgs={mockMemberOrgs}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText("Org Admin A")).toBeInTheDocument();
    expect(screen.getByText("Org Member B")).toBeInTheDocument();

    expect(screen.getByText("common.roles.admin")).toBeInTheDocument();
    expect(screen.getByText("common.roles.player")).toBeInTheDocument();
  });

  it("renders management gear for admin organizations but not for member organizations", () => {
    render(
      <BrowserRouter>
        <ConsolidatedOrganizationsList
          adminOrgs={mockAdminOrgs}
          memberOrgs={mockMemberOrgs}
        />
      </BrowserRouter>,
    );

    // Should find management button for org 101 (Admin)
    expect(screen.getByTestId("manage-org-101")).toBeInTheDocument();
    
    // Should NOT find management button for org 102 (Player)
    expect(screen.queryByTestId("manage-org-102")).not.toBeInTheDocument();
  });

  it("navigates to organization details when list item is clicked", () => {
    render(
      <BrowserRouter>
        <ConsolidatedOrganizationsList
          adminOrgs={mockAdminOrgs}
          memberOrgs={[]}
        />
      </BrowserRouter>,
    );

    const item = screen.getByTestId("org-link-Org Admin A");
    fireEvent.click(item);

    expect(mockNavigate).toHaveBeenCalledWith("/organizations/101");
  });

  it("navigates to management page when gear icon is clicked", () => {
    render(
      <BrowserRouter>
        <ConsolidatedOrganizationsList
          adminOrgs={mockAdminOrgs}
          memberOrgs={[]}
        />
      </BrowserRouter>,
    );

    const gear = screen.getByTestId("manage-org-101");
    fireEvent.click(gear);

    expect(mockNavigate).toHaveBeenCalledWith("/organizations/101/management");
  });

  it("renders empty state messages when user has no organizations", () => {
    render(
      <BrowserRouter>
        <ConsolidatedOrganizationsList
          adminOrgs={[]}
          memberOrgs={[]}
        />
      </BrowserRouter>,
    );

    expect(
      screen.getByText("home.sections.admin_orgs.empty"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("home.sections.member_orgs.empty_desc"),
    ).toBeInTheDocument();
  });
});
