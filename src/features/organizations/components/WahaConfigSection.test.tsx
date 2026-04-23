import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import WahaConfigSection from "./WahaConfigSection";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock API
const { mockUpdateOrganization, mockTestWaha } = vi.hoisted(() => ({
  mockUpdateOrganization: vi.fn(),
  mockTestWaha: vi.fn(),
}));

vi.mock("../../../shared/api/endpoints", () => ({
  createApi: vi.fn(() => ({
    updateOrganization: mockUpdateOrganization,
    testWaha: mockTestWaha,
  })),
}));

vi.mock("../../../shared/api/client", () => ({
  api: {},
}));

describe("WahaConfigSection", () => {
  const mockOrganization = {
    id: 1,
    name: "Test Org",
    waha_enabled: true,
    waha_api_url: "http://localhost:3000",
    waha_instance: "default",
    waha_group_id: "123@g.us",
    waha_use_all_mention: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial values including use_all_mention", () => {
    render(<WahaConfigSection organization={mockOrganization as any} />);

    expect(screen.getByDisplayValue("http://localhost:3000")).toBeInTheDocument();
    
    // In MUI, Switch is a role="switch"
    const toggle = screen.getByRole("switch", { name: "organizations.management.waha.use_all_mention" });
    expect(toggle).toBeChecked();
  });

  it("submits the form with updated use_all_mention value", async () => {
    mockUpdateOrganization.mockResolvedValue({});
    
    render(<WahaConfigSection organization={mockOrganization as any} />);

    const toggle = screen.getByRole("switch", { name: "organizations.management.waha.use_all_mention" });
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();

    fireEvent.click(screen.getByTestId("waha-save-button"));

    await waitFor(() => {
      expect(mockUpdateOrganization).toHaveBeenCalledWith(
        mockOrganization.id,
        expect.objectContaining({
          waha_use_all_mention: false,
        })
      );
    });
  });
});
