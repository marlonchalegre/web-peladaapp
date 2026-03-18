import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InvitePlayerDialog from "./InvitePlayerDialog";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

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
    onResetPublicLink: vi.fn().mockResolvedValue(undefined),
    loading: false,
  };

  it("renders correctly when open", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog {...defaultProps} />
      </LocalizationProvider>,
    );
    expect(
      screen.getByText("organizations.dialog.invite_player.title"),
    ).toBeInTheDocument();
    // Label is now common.fields.username
    expect(screen.getByLabelText("common.fields.username")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("common.fields.name"),
    ).not.toBeInTheDocument();
  });

  it("calls onInvite when send button is clicked", async () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog {...defaultProps} />
      </LocalizationProvider>,
    );

    const handleInput = screen.getByLabelText("common.fields.username");
    fireEvent.change(handleInput, { target: { value: "testuser" } });

    const sendButton = screen.getByText(
      "organizations.dialog.invite_player.send_invite",
    );
    fireEvent.click(sendButton);

    expect(defaultProps.onInvite).toHaveBeenCalledWith("testuser");
  });

  it("calls onFetchPublicLink when generate link button is clicked", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog {...defaultProps} />
      </LocalizationProvider>,
    );

    const generateButton = screen.getByText(
      "organizations.dialog.invite_player.generate_link",
    );
    fireEvent.click(generateButton);

    expect(defaultProps.onFetchPublicLink).toHaveBeenCalled();
  });

  it("calls onResetPublicLink when reset button is clicked", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog
          {...defaultProps}
          publicInviteLink="http://example.com/join/123"
        />
      </LocalizationProvider>,
    );

    const resetButton = screen.getByTestId("reset-public-link-button");
    fireEvent.click(resetButton);

    expect(defaultProps.onResetPublicLink).toHaveBeenCalled();
  });

  it("displays public link when provided", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog
          {...defaultProps}
          publicInviteLink="http://example.com/join/123"
        />
      </LocalizationProvider>,
    );

    expect(screen.getByText("http://example.com/join/123")).toBeInTheDocument();
    expect(
      screen.queryByText("organizations.dialog.invite_player.generate_link"),
    ).not.toBeInTheDocument();
  });

  it("displays success message when user is invited", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog
          {...defaultProps}
          invitedUser={{ email: "new@user.com", isNew: true }}
        />
      </LocalizationProvider>,
    );

    expect(
      screen.getByText("organizations.dialog.invite_player.new_user_success"),
    ).toBeInTheDocument();
  });
});
