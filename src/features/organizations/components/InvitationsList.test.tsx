import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InvitationsList from "./InvitationsList";
import type { OrganizationInvitation } from "../../../shared/api/endpoints";

describe("InvitationsList", () => {
  const mockInvitations: OrganizationInvitation[] = [
    {
      id: 1,
      organization_id: 1,
      email: "invitee@test.com",
      token: "token-1",
      status: "pending",
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      organization_id: 1,
      token: "token-2",
      status: "pending",
      created_at: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    invitations: mockInvitations,
    onRevoke: vi.fn(),
    actionLoading: false,
  };

  it("renders list of invitations", () => {
    render(<InvitationsList {...defaultProps} />);
    expect(screen.getByText("invitee@test.com")).toBeInTheDocument();
    expect(screen.getByText("organizations.invitation.public_link_label")).toBeInTheDocument();
  });

  it("calls onRevoke when delete button is clicked", () => {
    render(<InvitationsList {...defaultProps} />);
    
    const deleteButtons = screen.getAllByTitle("common.revoke");
    fireEvent.click(deleteButtons[0]);
    
    expect(defaultProps.onRevoke).toHaveBeenCalledWith(1);
  });

  it("displays empty message when no invitations", () => {
    render(<InvitationsList {...defaultProps} invitations={[]} />);
    expect(screen.getByText("organizations.invitation.empty")).toBeInTheDocument();
  });
});
