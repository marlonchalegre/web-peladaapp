import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GroupTabsBar, { type GroupTabKey } from "./GroupTabsBar";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("GroupTabsBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderBar = (
    active: GroupTabKey = "agenda",
    extra: { playersCount?: number; financePending?: number } = {},
  ) =>
    render(
      <MemoryRouter>
        <GroupTabsBar
          orgId="org-1"
          orgName="100Fôlego"
          active={active}
          {...extra}
        />
      </MemoryRouter>,
    );

  it("renders the group name and all five tabs", () => {
    renderBar();
    expect(screen.getByLabelText("Group sub-navigation")).toBeInTheDocument();
    expect(screen.getByText("100Fôlego")).toBeInTheDocument();
    expect(screen.getByText(/AGENDA/)).toBeInTheDocument();
    expect(screen.getByText(/ELENCO/)).toBeInTheDocument();
    expect(screen.getByText(/ESTATÍSTICAS/)).toBeInTheDocument();
    expect(screen.getByText(/FINANCEIRO/)).toBeInTheDocument();
    expect(screen.getByText(/AJUSTES/)).toBeInTheDocument();
  });

  it("navigates to each destination on click", () => {
    renderBar();

    fireEvent.click(screen.getByText(/AGENDA/));
    expect(mockNavigate).toHaveBeenCalledWith("/organizations/org-1");

    fireEvent.click(screen.getByText(/ELENCO/));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/organizations/org-1/management?tab=members",
    );

    fireEvent.click(screen.getByText(/ESTATÍSTICAS/));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/organizations/org-1/statistics",
    );

    fireEvent.click(screen.getByText(/FINANCEIRO/));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/organizations/org-1/management?tab=finance",
    );

    fireEvent.click(screen.getByText(/AJUSTES/));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/organizations/org-1/management?tab=settings",
    );
  });

  it("shows positive counts next to ELENCO and FINANCEIRO", () => {
    renderBar("agenda", { playersCount: 12, financePending: 3 });
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("hides counts when zero or unset", () => {
    renderBar("agenda", { playersCount: 0, financePending: 0 });
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
