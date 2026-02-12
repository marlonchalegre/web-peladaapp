import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InvitePlayerDialog from "./InvitePlayerDialog";

describe("InvitePlayerDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onInvite: vi.fn().mockResolvedValue(undefined),
    invitedUser: null,
    onClearInvited: vi.fn(),
    publicInviteLink: null,
    onFetchPublicLink: vi.fn().mockResolvedValue(undefined),
    loading: false,
  };

  it("renders correctly when open", () => {
    render(<InvitePlayerDialog {...defaultProps} />);
    expect(screen.getByText("organizations.dialog.invite_player.title")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
  });

  it("calls onInvite when send button is clicked", async () => {
    render(<InvitePlayerDialog {...defaultProps} />);
    
    const emailInput = screen.getByLabelText("auth.email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    
    const sendButton = screen.getByText("organizations.dialog.invite_player.send_invite");
    fireEvent.click(sendButton);
    
    expect(defaultProps.onInvite).toHaveBeenCalledWith("test@example.com");
  });

  it("calls onFetchPublicLink when generate link button is clicked", () => {
    render(<InvitePlayerDialog {...defaultProps} />);
    
    const generateButton = screen.getByText("organizations.dialog.invite_player.generate_link");
    fireEvent.click(generateButton);
    
    expect(defaultProps.onFetchPublicLink).toHaveBeenCalled();
  });

  it("displays public link when provided", () => {
    render(<InvitePlayerDialog {...defaultProps} publicInviteLink="http://example.com/join/123" />);
    
    expect(screen.getByText("http://example.com/join/123")).toBeInTheDocument();
    expect(screen.queryByText("organizations.dialog.invite_player.generate_link")).not.toBeInTheDocument();
  });

  it("displays success message when user is invited", () => {
    render(<InvitePlayerDialog {...defaultProps} invitedUser={{ email: "new@user.com", isNew: true }} />);
    
    expect(screen.getByText("organizations.dialog.invite_player.new_user_success")).toBeInTheDocument();
  });
});
