import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FinanceSection from "./FinanceSection";
import * as endpoints from "../../../shared/api/endpoints";

// Mock translations
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) => {
      if (
        key === "organizations.management.finance.categories" &&
        options?.returnObjects
      ) {
        return {
          monthly_fee: "Monthly Fee",
          diarista_fee: "Game Fee",
          field_rent: "Field Rent",
          equipment: "Equipment",
          other: "Other",
        };
      }
      return key;
    },
  }),
}));

// Mock API client
vi.mock("../../../shared/api/client", () => ({
  api: {},
}));

const mockSummary = {
  total_balance: 1000,
  total_income: 1500,
  total_expense: 500,
};

const mockFinance = {
  id: 1,
  organization_id: 10,
  mensalista_price: 100,
  diarista_price: 20,
  currency: "BRL",
};

const mockTransactions = {
  data: [
    {
      id: 1,
      organization_id: 10,
      amount: 100,
      type: "income",
      category: "monthly_fee",
      description: "Test income",
      payment_date: "2026-03-27",
      player_name: "Alice",
      creator_name: "Admin",
      status: "paid",
    },
  ],
  total: 1,
};

const mockMonthlyPayments = [
  {
    player_id: 101,
    player_name: "Alice",
    member_type: "mensalista",
    year: 2026,
    month: 3,
    paid: true,
  },
  {
    player_id: 102,
    player_name: "Bob",
    member_type: "mensalista",
    year: 2026,
    month: 3,
    paid: false,
  },
];

describe("FinanceSection", () => {
  const mockApi = {
    getFinanceSummary: vi.fn().mockResolvedValue(mockSummary),
    getOrganizationFinance: vi.fn().mockResolvedValue(mockFinance),
    listTransactions: vi.fn().mockResolvedValue(mockTransactions),
    getMonthlyPayments: vi.fn().mockResolvedValue(mockMonthlyPayments),
    updateOrganizationFinance: vi
      .fn()
      .mockResolvedValue({ message: "Success" }),
    addTransaction: vi.fn().mockResolvedValue({}),
    markMonthlyPayment: vi.fn().mockResolvedValue({}),
    reverseTransaction: vi.fn().mockResolvedValue({ message: "Reversed" }),
  };

  beforeEach(() => {
    vi.spyOn(endpoints, "createApi").mockReturnValue(
      mockApi as unknown as ReturnType<typeof endpoints.createApi>,
    );
  });

  it("renders summary cards with correct values", async () => {
    render(<FinanceSection orgId={10} isAdmin={true} />);

    await waitFor(() => {
      expect(screen.queryByTestId("finance-loading")).toBeNull();
    });

    expect(
      screen.getByText("organizations.management.finance.summary.balance"),
    ).toBeDefined();

    const balanceValue = screen.getByTestId("summary-balance-value");
    expect(balanceValue.getAttribute("data-amount")).toBe("1000");
  });

  it("switches between tabs and shows pagination", async () => {
    render(<FinanceSection orgId={10} isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeDefined();
    });

    // Switch to Transactions tab
    const transactionsTab = screen.getByTestId("finance-tab-transactions");
    fireEvent.click(transactionsTab);

    await waitFor(() => {
      expect(screen.getByText("Test income")).toBeDefined();
      expect(screen.getByText(/Admin/)).toBeDefined();
      expect(screen.getByRole("button", { name: /next page/i })).toBeDefined();
    });

    // Switch to Config tab
    const configTab = screen.getByTestId("finance-tab-config");
    fireEvent.click(configTab);

    await waitFor(() => {
      expect(screen.getByTestId("mensalista-price-input")).toBeDefined();
    });
  });

  it("marks monthly payment as paid", async () => {
    render(<FinanceSection orgId={10} isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeDefined();
    });

    const bobRow = screen.getByTestId("monthly-payment-row-102");
    const markPaidBtn = bobRow.querySelector("button");

    if (markPaidBtn) fireEvent.click(markPaidBtn);

    await waitFor(() => {
      expect(mockApi.markMonthlyPayment).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          player_id: 102,
          paid: true,
        }),
      );
    });
  });

  it("reverses monthly payment after confirmation", async () => {
    render(<FinanceSection orgId={10} isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeDefined();
    });

    const aliceRow = screen.getByTestId("monthly-payment-row-101");
    const reverseBtn = aliceRow.querySelector("button");

    if (reverseBtn) {
      fireEvent.click(reverseBtn);
    }

    // Should show confirmation dialog
    await waitFor(() => {
      expect(
        screen.getAllByText(
          "organizations.management.finance.monthly_fees.reverse",
        ).length,
      ).toBeGreaterThan(0);
    });

    // The confirm button in PrettyConfirmDialog has color warning
    const confirmBtn = screen.getByRole("button", {
      name: "organizations.management.finance.monthly_fees.reverse",
      pressed: undefined,
    });

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.markMonthlyPayment).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          player_id: 101,
          paid: false,
        }),
      );
    });
  });

  it("updates finance configuration with float values", async () => {
    render(<FinanceSection orgId={10} isAdmin={true} />);

    await waitFor(() => {
      const configTab = screen.getByTestId("finance-tab-config");
      fireEvent.click(configTab);
    });

    const mensalistaInput = screen.getByTestId("mensalista-price-input");
    const input = mensalistaInput.querySelector("input") || mensalistaInput;

    fireEvent.change(input, { target: { value: "150.50" } });

    const saveButton = screen.getByTestId("save-finance-config-button");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.updateOrganizationFinance).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          mensalista_price: 150.5,
        }),
      );
    });
  });
});
