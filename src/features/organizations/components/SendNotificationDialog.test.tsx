import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SendNotificationDialog from "./SendNotificationDialog";
import type { Organization } from "../../../shared/api/endpoints";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock API endpoints
const { mockSendNotification, mockListPeladasByOrg } = vi.hoisted(() => ({
  mockSendNotification: vi.fn(),
  mockListPeladasByOrg: vi.fn(),
}));

vi.mock("../../../shared/api/endpoints", () => ({
  createApi: vi.fn(() => ({
    sendNotification: mockSendNotification,
    listPeladasByOrg: mockListPeladasByOrg,
  })),
}));

vi.mock("../../../shared/api/client", () => ({
  api: {},
}));

describe("SendNotificationDialog", () => {
  const mockOrganization: Organization = {
    id: "org-123",
    name: "Test Organization",
    waha_enabled: true,
  };

  const mockPeladas = {
    data: [
      {
        id: "pelada-active-1",
        organization_id: "org-123",
        status: "attendance",
        scheduled_at: "2026-08-01T10:00:00.000Z",
      },
      {
        id: "pelada-running-2",
        organization_id: "org-123",
        status: "running",
        scheduled_at: "2026-07-25T10:00:00.000Z",
      },
      {
        id: "pelada-closed-newest",
        organization_id: "org-123",
        status: "closed",
        scheduled_at: "2026-07-20T10:00:00.000Z",
      },
      {
        id: "pelada-closed-older",
        organization_id: "org-123",
        status: "closed",
        scheduled_at: "2026-07-15T10:00:00.000Z",
      },
    ],
    total: 4,
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    organization: mockOrganization,
    showToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockListPeladasByOrg.mockResolvedValue(mockPeladas);
    mockSendNotification.mockResolvedValue({
      status: "success",
      message: "Sucesso",
    });
  });

  it("renders custom message tab by default", () => {
    render(<SendNotificationDialog {...defaultProps} />);

    expect(screen.getByText("Comunicações WhatsApp")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Escreva sua mensagem aqui..."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Dica: Use/)).toBeInTheDocument();
  });

  it("displays warning banner when WAHA is disabled", () => {
    const disabledWahaOrg = { ...mockOrganization, waha_enabled: false };
    render(
      <SendNotificationDialog
        {...defaultProps}
        organization={disabledWahaOrg}
      />,
    );

    expect(
      screen.getByText(/Atenção: A integração com o WhatsApp/),
    ).toBeInTheDocument();
  });

  it("disables send button when custom message is empty", () => {
    render(<SendNotificationDialog {...defaultProps} />);
    const sendBtn = screen.getByRole("button", { name: "Enviar" });
    expect(sendBtn).toBeDisabled();
  });

  it("sends custom message successfully", async () => {
    const user = userEvent.setup();
    render(<SendNotificationDialog {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(
      "Escreva sua mensagem aqui...",
    );
    await user.type(textarea, "Fala galera, hoje tem pelada!");

    const sendBtn = screen.getByRole("button", { name: "Enviar" });
    expect(sendBtn).toBeEnabled();

    await user.click(sendBtn);

    expect(mockSendNotification).toHaveBeenCalledWith("org-123", {
      action: "custom",
      message: "Fala galera, hoje tem pelada!",
    });
    await waitFor(() => {
      expect(defaultProps.showToast).toHaveBeenCalledWith("Sucesso", "success");
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it("filters peladas to active ones plus the most recent closed one", async () => {
    render(<SendNotificationDialog {...defaultProps} />);

    // Switch to Resend tab using direct tab button click
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[1]);

    // Verify listPeladasByOrg was called
    expect(mockListPeladasByOrg).toHaveBeenCalledWith("org-123", 1, 100);

    // Wait for the loader to clear and the select element to be rendered
    await waitFor(() => {
      expect(screen.getByTestId("pelada-select")).toBeInTheDocument();
    });

    // Click the pelada select trigger using fireEvent.mouseDown on role="combobox"
    const peladaSelectWrapper = screen.getByTestId("pelada-select");
    const selectTrigger =
      peladaSelectWrapper.querySelector("[role='combobox']") ||
      peladaSelectWrapper;
    fireEvent.mouseDown(selectTrigger);

    // Get menu items (combobox lists items)
    const options = screen.getAllByRole("option");

    // We expect: pelada-active-1, pelada-running-2, and pelada-closed-newest
    // but NOT pelada-closed-older
    expect(options).toHaveLength(3);
  });

  it("sends resent notification template successfully", async () => {
    const user = userEvent.setup();
    render(<SendNotificationDialog {...defaultProps} />);

    // Switch to Resend tab
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[1]);

    // Wait for elements to render
    await waitFor(() => {
      expect(
        screen.getByTestId("notification-type-select"),
      ).toBeInTheDocument();
    });

    // Select notification type
    const typeSelectWrapper = screen.getByTestId("notification-type-select");
    const typeTrigger =
      typeSelectWrapper.querySelector("[role='combobox']") || typeSelectWrapper;
    fireEvent.mouseDown(typeTrigger);

    const startOption = screen.getByText("Escalação / Pelada Iniciada");
    fireEvent.click(startOption);

    // Select pelada
    const peladaSelectWrapper = screen.getByTestId("pelada-select");
    const peladaTrigger =
      peladaSelectWrapper.querySelector("[role='combobox']") ||
      peladaSelectWrapper;
    fireEvent.mouseDown(peladaTrigger);

    const activePeladaOption = screen.getAllByRole("option")[0];
    fireEvent.click(activePeladaOption);

    const sendBtn = screen.getByRole("button", { name: "Enviar" });
    expect(sendBtn).toBeEnabled();

    await user.click(sendBtn);

    expect(mockSendNotification).toHaveBeenCalledWith("org-123", {
      action: "resend",
      notification_type: "start",
      pelada_id: "pelada-active-1",
    });
    await waitFor(() => {
      expect(defaultProps.showToast).toHaveBeenCalledWith("Sucesso", "success");
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
