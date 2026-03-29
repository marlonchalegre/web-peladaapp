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

describe("FinanceSection - Calculation Scenarios", () => {
  const mockApi = {
    getFinanceSummary: vi.fn(),
    getOrganizationFinance: vi
      .fn()
      .mockResolvedValue({
        mensalista_price: 70,
        diarista_price: 20,
        currency: "BRL",
      }),
    listTransactions: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getMonthlyPayments: vi.fn().mockResolvedValue([]),
    addTransaction: vi.fn().mockResolvedValue({}),
    reverseTransaction: vi.fn().mockResolvedValue({}),
    updateOrganizationFinance: vi
      .fn()
      .mockResolvedValue({ message: "Success" }),
  };

  beforeEach(() => {
    vi.spyOn(endpoints, "createApi").mockReturnValue(
      mockApi as unknown as ReturnType<typeof endpoints.createApi>,
    );
  });

  it("Scenario 1: Positive transaction (Income) and its Reversal", async () => {
    // 1. Initial State: 0, 0, 0
    mockApi.getFinanceSummary.mockResolvedValueOnce({
      total_balance: 0,
      total_income: 0,
      total_expense: 0,
    });

    render(<FinanceSection orgId={10} isAdmin={true} />);

    await waitFor(() => {
      expect(screen.queryByTestId("finance-loading")).toBeNull();
    });

    expect(
      screen.getByTestId("summary-balance-value").getAttribute("data-amount"),
    ).toBe("0");

    // 2. Player makes a deposit of 10
    mockApi.getFinanceSummary.mockResolvedValue({
      total_balance: 10,
      total_income: 10,
      total_expense: 0,
    });
    mockApi.listTransactions.mockResolvedValue({
      data: [
        {
          id: 1,
          amount: 10,
          type: "income",
          status: "paid",
          category: "other",
          description: "Deposit",
          payment_date: "2026-03-28",
        },
      ],
      total: 1,
    });

    const transactionsTab = screen.getByTestId("finance-tab-transactions");
    fireEvent.click(transactionsTab);

    const addBtn = await screen.findByTestId("add-transaction-button");
    fireEvent.click(addBtn);

    const amountInput = screen.getByTestId("tx-amount-input");
    fireEvent.change(amountInput, { target: { value: "10" } });

    const confirmBtn = screen.getByTestId("confirm-add-transaction-button");
    fireEvent.click(confirmBtn);

    // Verify summary updated
    await waitFor(() => {
      expect(
        screen.getByTestId("summary-balance-value").getAttribute("data-amount"),
      ).toBe("10");
      expect(
        screen.getByTestId("summary-income-value").getAttribute("data-amount"),
      ).toBe("10");
      expect(
        screen.getByTestId("summary-expense-value").getAttribute("data-amount"),
      ).toBe("0");
    });

    // 3. Reverse the payment
    mockApi.getFinanceSummary.mockResolvedValue({
      total_balance: 0,
      total_income: 0,
      total_expense: 0,
    });
    mockApi.listTransactions.mockResolvedValue({
      data: [
        {
          id: 1,
          amount: 10,
          type: "income",
          status: "reversed",
          category: "other",
          description: "Deposit",
          payment_date: "2026-03-28",
        },
      ],
      total: 1,
    });

    const reverseBtn = screen.getByTestId("reverse-transaction-1");
    fireEvent.click(reverseBtn);

    // Verify summary returns to 0
    await waitFor(() => {
      expect(
        screen.getByTestId("summary-balance-value").getAttribute("data-amount"),
      ).toBe("0");
      expect(
        screen.getByTestId("summary-income-value").getAttribute("data-amount"),
      ).toBe("0");
      expect(
        screen.getByTestId("summary-expense-value").getAttribute("data-amount"),
      ).toBe("0");
    });
  });

  it("Scenario 2: Negative transaction (Expense) and its Reversal", async () => {
    mockApi.getFinanceSummary.mockResolvedValueOnce({
      total_balance: 0,
      total_income: 0,
      total_expense: 0,
    });

    render(<FinanceSection orgId={10} isAdmin={true} />);

    await waitFor(() => {
      expect(screen.queryByTestId("finance-loading")).toBeNull();
    });

    // 1. Buy a ball for 100
    mockApi.getFinanceSummary.mockResolvedValue({
      total_balance: -100,
      total_income: 0,
      total_expense: 100,
    });
    mockApi.listTransactions.mockResolvedValue({
      data: [
        {
          id: 2,
          amount: 100,
          type: "expense",
          status: "paid",
          category: "equipment",
          description: "Ball",
          payment_date: "2026-03-28",
        },
      ],
      total: 1,
    });

    const transactionsTab = screen.getByTestId("finance-tab-transactions");
    fireEvent.click(transactionsTab);

    const addBtn = await screen.findByTestId("add-transaction-button");
    fireEvent.click(addBtn);

    const confirmBtn = screen.getByTestId("confirm-add-transaction-button");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getByTestId("summary-balance-value").getAttribute("data-amount"),
      ).toBe("-100");
      expect(
        screen.getByTestId("summary-income-value").getAttribute("data-amount"),
      ).toBe("0");
      expect(
        screen.getByTestId("summary-expense-value").getAttribute("data-amount"),
      ).toBe("100");
    });

    // 2. Reverse (Return ball)
    mockApi.getFinanceSummary.mockResolvedValue({
      total_balance: 0,
      total_income: 0,
      total_expense: 0,
    });
    mockApi.listTransactions.mockResolvedValue({
      data: [
        {
          id: 2,
          amount: 100,
          type: "expense",
          status: "reversed",
          category: "equipment",
          description: "Ball",
          payment_date: "2026-03-28",
        },
      ],
      total: 1,
    });

    const reverseBtn = screen.getByTestId("reverse-transaction-2");
    fireEvent.click(reverseBtn);

    await waitFor(() => {
      expect(
        screen.getByTestId("summary-balance-value").getAttribute("data-amount"),
      ).toBe("0");
      expect(
        screen.getByTestId("summary-income-value").getAttribute("data-amount"),
      ).toBe("0");
      expect(
        screen.getByTestId("summary-expense-value").getAttribute("data-amount"),
      ).toBe("0");
    });
  });
});
