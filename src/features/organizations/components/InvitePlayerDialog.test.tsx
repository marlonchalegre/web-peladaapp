import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InvitePlayerDialog from "./InvitePlayerDialog";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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
    expect(
      screen.getByText("organizations.dialog.invite_player.title"),
    ).toBeInTheDocument();
    // Labels are now common.fields.email and common.fields.name
    expect(screen.getByLabelText("common.fields.email")).toBeInTheDocument();
    expect(screen.getByLabelText("common.fields.name")).toBeInTheDocument();
  });

  it("calls onInvite when send button is clicked", async () => {
    render(<InvitePlayerDialog {...defaultProps} />);

    const handleInput = screen.getByLabelText("common.fields.email");
    fireEvent.change(handleInput, { target: { value: "testuser" } });

    const sendButton = screen.getByText(
      "organizations.dialog.invite_player.send_invite",
    );
    fireEvent.click(sendButton);

    expect(defaultProps.onInvite).toHaveBeenCalledWith("testuser", undefined);
  });

  it("calls onFetchPublicLink when generate link button is clicked", () => {
    render(<InvitePlayerDialog {...defaultProps} />);

    const generateButton = screen.getByText(
      "organizations.dialog.invite_player.generate_link",
    );
    fireEvent.click(generateButton);

    expect(defaultProps.onFetchPublicLink).toHaveBeenCalled();
  });

  it("displays public link when provided", () => {
    render(
      <InvitePlayerDialog
        {...defaultProps}
        publicInviteLink="http://example.com/join/123"
      />,
    );

    expect(screen.getByText("http://example.com/join/123")).toBeInTheDocument();
    expect(
      screen.queryByText("organizations.dialog.invite_player.generate_link"),
    ).not.toBeInTheDocument();
  });

  it("displays success message when user is invited", () => {
    render(
      <InvitePlayerDialog
        {...defaultProps}
        invitedUser={{ email: "new@user.com", isNew: true }}
      />,
    );

    expect(
      screen.getByText("organizations.dialog.invite_player.new_user_success"),
    ).toBeInTheDocument();
  });
});
