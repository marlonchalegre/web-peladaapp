import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Paper,
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
import { api as apiClient } from "../../../shared/api/client";
import { clearFinanceCache } from "../../../shared/hooks/useOrganizationFinance";
import {
  createApi,
  type Transaction,
  type MonthlyPayment,
  type OrganizationFinance,
  type FinanceSummary,
} from "../../../shared/api/endpoints";

import SummaryCards from "./finance/SummaryCards";
import MonthlyPaymentsTable from "./finance/MonthlyPaymentsTable";
import TransactionsTable from "./finance/TransactionsTable";
import FinanceConfigForm from "./finance/FinanceConfigForm";
import AddTransactionDialog from "./finance/AddTransactionDialog";
import MarkPaymentDialog from "./finance/MarkPaymentDialog";
import { calculateMonthlyFine } from "./finance/utils";

interface FinanceSectionProps {
  orgId: string;
  isAdmin?: boolean;
}

export default function FinanceSection({
  orgId,
  isAdmin = false,
}: FinanceSectionProps) {
  const { t } = useTranslation();
  const api = useMemo(() => createApi(apiClient), []);
  const [activeTab, setActiveTab] = useState(0);
  const [configLoading, setConfigLoading] = useState(true);
  const [dynamicLoading, setDynamicLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [finance, setFinance] = useState<OrganizationFinance>({
    id: "0",
    organization_id: orgId,
    mensalista_price: 0,
    diarista_price: 0,
    currency: "BRL",
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);

  // Pagination for transactions
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Local string states for inputs to allow typing decimals smoothly
  const [mensalistaPriceStr, setMensalistaPriceStr] = useState("0");
  const [diaristaPriceStr, setDiaristaPriceStr] = useState("0");
  const [monthlyFineAmountStr, setMonthlyFineAmountStr] = useState("0");
  const [monthlyCutOffDay, setMonthlyCutOffDay] = useState(5);

  // Filters for monthly payments
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Dialog / Dialog triggers states
  const [isTxDialogOpen, setIsTxDialogOpen] = useState(false);
  const [confirmReverseOpen, setConfirmReverseOpen] = useState(false);
  const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false);
  const [playerToMark, setPlayerToMark] = useState<MonthlyPayment | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<MonthlyPayment | null>(
    null,
  );

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const financeRes = await api.getOrganizationFinance(orgId);
      if (financeRes) {
        setFinance(financeRes);
        setMensalistaPriceStr(String(financeRes.mensalista_price));
        setDiaristaPriceStr(String(financeRes.diarista_price));
        setMonthlyFineAmountStr(String(financeRes.monthly_fine_amount || 0));
        setMonthlyCutOffDay(financeRes.monthly_cut_off_day || 5);
      }
    } catch (err) {
      console.error("Failed to fetch finance config", err);
    } finally {
      setConfigLoading(false);
    }
  }, [api, orgId]);

  const fetchDynamicData = useCallback(async () => {
    setDynamicLoading(true);
    setError(null);
    try {
      const [summaryRes, txData, mpRes] = await Promise.all([
        api.getFinanceSummary(orgId),
        api.listTransactions(orgId, page + 1, rowsPerPage),
        api.getMonthlyPayments(orgId, selectedYear, selectedMonth),
      ]);
      setSummary(summaryRes);
      setTransactions(txData.data);
      setTotalTransactions(txData.total);
      setMonthlyPayments(mpRes);
    } catch (err) {
      console.error("Failed to fetch finance dynamic data", err);
      setError(
        t(
          "organizations.management.finance.error.load_failed",
          "Erro ao carregar dados financeiros",
        ),
      );
    } finally {
      setDynamicLoading(false);
    }
  }, [api, orgId, page, rowsPerPage, selectedYear, selectedMonth, t]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    fetchDynamicData();
  }, [fetchDynamicData]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUpdateFinance = async () => {
    if (!finance || !isAdmin) return;
    try {
      setSuccess(null);
      const payload = {
        ...finance,
        mensalista_price: Number(String(mensalistaPriceStr).replace(",", ".")),
        diarista_price: Number(String(diaristaPriceStr).replace(",", ".")),
        monthly_fine_amount: Number(
          String(monthlyFineAmountStr).replace(",", "."),
        ),
        monthly_cut_off_day: Number(monthlyCutOffDay),
      };
      await api.updateOrganizationFinance(orgId, payload);
      clearFinanceCache(orgId);
      await Promise.all([fetchConfig(), fetchDynamicData()]);
      setSuccess(t("organizations.management.finance.config.success"));
    } catch (err) {
      console.error("Failed to update finance config", err);
      setError(
        t(
          "organizations.management.finance.config.error.save_failed",
          "Erro ao salvar configuração",
        ),
      );
    }
  };

  const handleAddTransaction = async (txData: {
    type: "income" | "expense";
    amount: number;
    category: string;
    description: string;
    payment_date: string;
  }) => {
    if (!isAdmin) return;
    try {
      setSuccess(null);
      await api.addTransaction(orgId, txData);
      setIsTxDialogOpen(false);
      await fetchDynamicData();
    } catch (err) {
      console.error("Failed to add transaction", err);
      setError(
        t(
          "organizations.management.finance.transactions.error.add_failed",
          "Erro ao adicionar transação",
        ),
      );
    }
  };

  const executeMarkPayment = async (
    player: MonthlyPayment,
    applyFine: boolean,
  ) => {
    try {
      setSuccess(null);
      const paymentDate = new Date().toISOString().split("T")[0];
      const baseAmount = finance.mensalista_price;
      const fineAmount = applyFine
        ? Number(String(monthlyFineAmountStr).replace(",", "."))
        : 0;

      await api.markMonthlyPayment(orgId, {
        player_id: player.player_id,
        year: selectedYear,
        month: selectedMonth,
        paid: true,
        amount: Number(baseAmount) + Number(fineAmount),
        fine_amount: Number(fineAmount),
        payment_date: paymentDate,
      });
      await fetchDynamicData();
      setSuccess(t("organizations.management.finance.monthly_fees.success"));
      setIsMarkDialogOpen(false);
      setPlayerToMark(null);
    } catch (err) {
      console.error("Failed to mark payment", err);
      setError(
        t(
          "organizations.management.finance.monthly_fees.error.update_failed",
          "Erro ao atualizar pagamento",
        ),
      );
    }
  };

  const handleMarkPayment = async (player: MonthlyPayment, paid: boolean) => {
    if (!isAdmin) return;

    if (!paid) {
      setSelectedPayment(player);
      setConfirmReverseOpen(true);
      return;
    }

    const fine = calculateMonthlyFine(
      selectedYear,
      selectedMonth,
      new Date().toISOString().split("T")[0],
      Number(String(monthlyFineAmountStr).replace(",", ".")),
      Number(monthlyCutOffDay),
    );

    if (Number(fine) > 0) {
      setPlayerToMark(player);
      setIsMarkDialogOpen(true);
    } else {
      executeMarkPayment(player, false);
    }
  };

  const handleConfirmReverse = async () => {
    if (!isAdmin || !selectedPayment) return;
    try {
      setSuccess(null);
      setConfirmReverseOpen(false);
      await api.markMonthlyPayment(orgId, {
        player_id: selectedPayment.player_id,
        year: selectedYear,
        month: selectedMonth,
        paid: false,
        amount: finance.mensalista_price,
        payment_date: new Date().toISOString().split("T")[0],
      });
      await fetchDynamicData();
      setSuccess(t("organizations.management.finance.monthly_fees.success"));
      setSelectedPayment(null);
    } catch (err) {
      console.error("Failed to reverse payment", err);
      setError(
        t(
          "organizations.management.finance.monthly_fees.error.update_failed",
          "Erro ao atualizar pagamento",
        ),
      );
    }
  };

  const [txToReverse, setTxToReverse] = useState<string | null>(null);
  const [confirmReverseTxOpen, setConfirmReverseTxOpen] = useState(false);

  const handleReverseTransaction = (txId: string) => {
    if (!isAdmin) return;
    setTxToReverse(txId);
    setConfirmReverseTxOpen(true);
  };

  const executeReverseTransaction = async () => {
    if (!isAdmin || !txToReverse) return;
    try {
      setSuccess(null);
      await api.reverseTransaction(orgId, txToReverse);
      await fetchDynamicData();
      setSuccess(
        t(
          "organizations.management.finance.transactions.reverse_success",
          "Transação estornada com sucesso!",
        ),
      );
      setTxToReverse(null);
    } catch (err) {
      console.error("Failed to reverse transaction", err);
      setError(
        t(
          "organizations.management.finance.transactions.error.reverse_failed",
          "Erro ao estornar transação",
        ),
      );
    }
  };

  const setCurrency = (val: string) => {
    setFinance((prev) => ({ ...prev, currency: val }));
  };

  if (
    (configLoading || dynamicLoading) &&
    !summary &&
    transactions.length === 0
  )
    return <CircularProgress data-testid="finance-loading" />;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: "bold",
        }}
      >
        {t("organizations.management.finance.title")}
      </Typography>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
          data-testid="finance-error"
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
          data-testid="finance-success"
        >
          {success}
        </Alert>
      )}

      {/* Summary Section */}
      <SummaryCards
        totalBalance={summary?.total_balance || 0}
        totalIncome={summary?.total_income || 0}
        totalExpense={summary?.total_expense || 0}
        currency={finance?.currency}
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          data-testid="finance-tabs"
        >
          <Tab
            label={t("organizations.management.finance.monthly_fees.title")}
            data-testid="finance-tab-monthly"
          />
          <Tab
            label={t("organizations.management.finance.transactions.title")}
            data-testid="finance-tab-transactions"
          />
          {isAdmin && (
            <Tab
              label={t("organizations.management.finance.config.title")}
              data-testid="finance-tab-config"
            />
          )}
        </Tabs>
      </Box>

      {/* Monthly Fees Tab */}
      {activeTab === 0 && (
        <MonthlyPaymentsTable
          monthlyPayments={monthlyPayments}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          isAdmin={isAdmin}
          mensalistaPrice={finance.mensalista_price}
          monthlyFineAmount={finance.monthly_fine_amount || 0}
          monthlyCutOffDay={monthlyCutOffDay}
          currency={finance.currency}
          onMarkPayment={handleMarkPayment}
        />
      )}

      {/* Transactions Tab */}
      {activeTab === 1 && (
        <TransactionsTable
          transactions={transactions}
          totalTransactions={totalTransactions}
          rowsPerPage={rowsPerPage}
          page={page}
          isAdmin={isAdmin}
          currency={finance.currency}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          onAddTransactionClick={() => setIsTxDialogOpen(true)}
          onReverseTransactionClick={handleReverseTransaction}
        />
      )}

      {/* Config Tab */}
      {activeTab === 2 && finance && isAdmin && (
        <FinanceConfigForm
          mensalistaPriceStr={mensalistaPriceStr}
          setMensalistaPriceStr={setMensalistaPriceStr}
          diaristaPriceStr={diaristaPriceStr}
          setDiaristaPriceStr={setDiaristaPriceStr}
          monthlyFineAmountStr={monthlyFineAmountStr}
          setMonthlyFineAmountStr={setMonthlyFineAmountStr}
          monthlyCutOffDay={monthlyCutOffDay}
          setMonthlyCutOffDay={setMonthlyCutOffDay}
          currency={finance.currency}
          setCurrency={setCurrency}
          onUpdateFinance={handleUpdateFinance}
        />
      )}

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={isTxDialogOpen}
        onClose={() => setIsTxDialogOpen(false)}
        onAddTransaction={handleAddTransaction}
      />

      {/* Mark Payment Dialog */}
      <MarkPaymentDialog
        open={isMarkDialogOpen}
        onClose={() => {
          setIsMarkDialogOpen(false);
          setPlayerToMark(null);
        }}
        playerToMark={playerToMark}
        fineAmountStr={monthlyFineAmountStr}
        currency={finance.currency}
        onConfirm={executeMarkPayment}
      />

      <PrettyConfirmDialog
        open={confirmReverseOpen}
        onClose={() => {
          setConfirmReverseOpen(false);
          setSelectedPayment(null);
        }}
        onConfirm={handleConfirmReverse}
        title={t("organizations.management.finance.monthly_fees.reverse")}
        description={t(
          "organizations.management.finance.monthly_fees.reverse_confirm",
        )}
        confirmLabel={t(
          "organizations.management.finance.monthly_fees.reverse",
        )}
        severity="warning"
      />

      <PrettyConfirmDialog
        open={confirmReverseTxOpen}
        onClose={() => {
          setConfirmReverseTxOpen(false);
          setTxToReverse(null);
        }}
        onConfirm={executeReverseTransaction}
        title={t(
          "organizations.management.finance.transactions.mark_as_reversed",
          "Estornar",
        )}
        description={t(
          "organizations.management.finance.transactions.reverse_confirm",
          "Deseja realmente estornar esta transação?",
        )}
        confirmLabel={t("common.confirm")}
        severity="warning"
      />
    </Paper>
  );
}
