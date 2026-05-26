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

  it("copies public link to clipboard when copy button is clicked", () => {
    const writeTextMock = vi.fn();
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog
          {...defaultProps}
          publicInviteLink="http://example.com/join/123"
        />
      </LocalizationProvider>,
    );

    const copyButton = screen.getByTestId("copy-public-link-button");
    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith("http://example.com/join/123");
    vi.unstubAllGlobals();
  });

  it("copies invitation link to clipboard when copy invitation link button is clicked", () => {
    const writeTextMock = vi.fn();
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog
          {...defaultProps}
          invitedUser={{ email: "new@user.com", isNew: true, token: "testtoken" }}
        />
      </LocalizationProvider>,
    );

    const copyButton = screen.getByTestId("copy-invitation-link-button");
    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith(
      `${window.location.origin}/first-access?token=testtoken&email=new%40user.com`
    );
    vi.unstubAllGlobals();
  });

  it("handles console.error output when onInvite throws an error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onInviteError = vi.fn().mockRejectedValue(new Error("Invite failed"));

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog {...defaultProps} onInvite={onInviteError} />
      </LocalizationProvider>,
    );

    const handleInput = screen.getByLabelText("common.fields.username");
    fireEvent.change(handleInput, { target: { value: "testuser" } });

    const sendButton = screen.getByText(
      "organizations.dialog.invite_player.send_invite",
    );
    fireEvent.click(sendButton);

    await vi.waitFor(() => {
      expect(onInviteError).toHaveBeenCalledWith("testuser");
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("displays success message when user is invited by name only", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog
          {...defaultProps}
          invitedUser={{ name: "John Doe", isNew: true }}
        />
      </LocalizationProvider>,
    );

    expect(
      screen.getByTestId("invite-name-success-alert"),
    ).toHaveTextContent("common.welcome - John Doe added!");
  });

  it("displays success message when existing user is invited", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog
          {...defaultProps}
          invitedUser={{ email: "existing@user.com", isNew: false }}
        />
      </LocalizationProvider>,
    );

    expect(
      screen.getByTestId("invite-existing-success-alert"),
    ).toBeInTheDocument();
  });

  it("verifies close button and onClose / onClearInvited functionality", () => {
    const onCloseMock = vi.fn();
    const onClearInvitedMock = vi.fn();

    // 1. When user has been invited (displays common.close)
    const { rerender } = render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog
          {...defaultProps}
          onClose={onCloseMock}
          onClearInvited={onClearInvitedMock}
          invitedUser={{ email: "new@user.com", isNew: true }}
        />
      </LocalizationProvider>,
    );

    const closeButton = screen.getByTestId("invite-dialog-close-button");
    expect(closeButton).toHaveTextContent("common.close");
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalled();
    expect(onClearInvitedMock).toHaveBeenCalled();

    vi.clearAllMocks();

    // 2. When user has not been invited (displays common.cancel)
    rerender(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog
          {...defaultProps}
          onClose={onCloseMock}
          onClearInvited={onClearInvitedMock}
          invitedUser={null}
        />
      </LocalizationProvider>,
    );

    const cancelButton = screen.getByTestId("invite-dialog-close-button");
    expect(cancelButton).toHaveTextContent("common.cancel");
    fireEvent.click(cancelButton);
    expect(onCloseMock).toHaveBeenCalled();
    expect(onClearInvitedMock).toHaveBeenCalled();
  });

  it("calls onClose and onClearInvited when Dialog onClose is triggered", () => {
    const onCloseMock = vi.fn();
    const onClearInvitedMock = vi.fn();

    render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <InvitePlayerDialog
          {...defaultProps}
          onClose={onCloseMock}
          onClearInvited={onClearInvitedMock}
        />
      </LocalizationProvider>,
    );

    // Trigger Dialog onClose directly or by clicking backdrop
    const backdrop = document.querySelector(".MuiBackdrop-root");
    if (backdrop) {
      fireEvent.click(backdrop);
    } else {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape", keyCode: 27 });
    }
    expect(onCloseMock).toHaveBeenCalled();
    expect(onClearInvitedMock).toHaveBeenCalled();
  });
});
