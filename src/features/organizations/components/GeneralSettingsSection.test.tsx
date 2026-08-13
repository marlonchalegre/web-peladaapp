import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import GeneralSettingsSection from "./GeneralSettingsSection";
import type { Organization } from "../../../shared/api/endpoints";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

const { mockUpdateOrganization } = vi.hoisted(() => ({
  mockUpdateOrganization: vi.fn(),
}));

vi.mock("../../../shared/api/endpoints", () => ({
  createApi: vi.fn(() => ({
    updateOrganization: mockUpdateOrganization,
  })),
}));

vi.mock("../../../shared/api/client", () => ({
  api: {},
}));

describe("GeneralSettingsSection", () => {
  const mockOrganization: Organization = {
    id: "org-123",
    name: "Test Org",
    priority_confirmation_limit_hours: 24,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial priority_confirmation_limit_hours", () => {
    render(<GeneralSettingsSection organization={mockOrganization} />);

    const input = screen.getByTestId(
      "priority-confirmation-limit-input",
    ) as HTMLInputElement;
    expect(input.value).toBe("24");
  });

  it("submits updated priority_confirmation_limit_hours", async () => {
    mockUpdateOrganization.mockResolvedValue({});
    const onUpdateSuccess = vi.fn();

    render(
      <GeneralSettingsSection
        organization={mockOrganization}
        onUpdateSuccess={onUpdateSuccess}
      />,
    );

    const input = screen.getByTestId("priority-confirmation-limit-input");
    fireEvent.change(input, { target: { value: "48" } });

    const saveBtn = screen.getByTestId("save-general-settings-btn");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateOrganization).toHaveBeenCalledWith("org-123", {
        name: "Test Org",
        priority_confirmation_limit_hours: 48,
      });
      expect(onUpdateSuccess).toHaveBeenCalled();
    });
  });
});
