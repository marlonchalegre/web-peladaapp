import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PendingInvitations from "./PendingInvitations";
import type { OrganizationInvitation } from "../../../shared/api/endpoints";

describe("PendingInvitations", () => {
  const mockInvitations: OrganizationInvitation[] = [
    {
      id: 1,
      organization_id: 10,
      organization_name: "Test Org",
      email: "me@test.com",
      token: "token-123",
      status: "pending",
      created_at: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    invitations: mockInvitations,
    onAccept: vi.fn(),
  };

  it("renders pending invitations", () => {
    render(<PendingInvitations {...defaultProps} />);
    expect(screen.getByText("home.sections.pending_invitations.title")).toBeInTheDocument();
    expect(screen.getByText("Test Org")).toBeInTheDocument();
  });

  it("calls onAccept when button is clicked", () => {
    render(<PendingInvitations {...defaultProps} />);
    
    const acceptButton = screen.getByText("common.accept");
    fireEvent.click(acceptButton);
    
    expect(defaultProps.onAccept).toHaveBeenCalledWith("token-123");
  });

  it("renders nothing when no invitations", () => {
    const { container } = render(<PendingInvitations invitations={[]} onAccept={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
