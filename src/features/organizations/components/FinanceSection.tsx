import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import { useTranslation } from "react-i18next";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
import { api as apiClient } from "../../../shared/api/client";
import {
  createApi,
  type Transaction,
  type MonthlyPayment,
  type OrganizationFinance,
  type FinanceSummary,
} from "../../../shared/api/endpoints";

interface FinanceSectionProps {
  orgId: number;
  isAdmin?: boolean;
}

interface SummaryCardProps {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  testId: string;
  currency?: string;
}

const SummaryCard = ({
  title,
  value,
  color,
  icon,
  testId,
  currency = "BRL",
}: SummaryCardProps) => (
  <Card variant="outlined" sx={{ height: "100%" }} data-testid={testId}>
    <CardContent>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography color="text.secondary" gutterBottom variant="overline">
          {title}
        </Typography>
        {icon}
      </Box>
      <Typography
        variant="h5"
        fontWeight="bold"
        color={color}
        data-testid={`${testId}-value`}
        data-amount={value}
      >
        {new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: currency,
        }).format(value)}
      </Typography>
    </CardContent>
  </Card>
);

export default function FinanceSection({
  orgId,
  isAdmin = false,
}: FinanceSectionProps) {
  const { t } = useTranslation();
  const api = useMemo(() => createApi(apiClient), []);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [finance, setFinance] = useState<OrganizationFinance>({
    id: 0,
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

  // Filters for monthly payments
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Transaction Dialog state
  const [isTxDialogOpen, setIsTxDialogOpen] = useState(false);
  const [txAmountStr, setTxAmountStr] = useState("0");
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: "income",
    amount: 0,
    category: "other",
    payment_date: new Date().toISOString().split("T")[0],
  });

  const [confirmReverseOpen, setConfirmReverseOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<MonthlyPayment | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, financeRes, txData, mpRes] = await Promise.all([
        api.getFinanceSummary(orgId),
        api.getOrganizationFinance(orgId),
        api.listTransactions(orgId, page + 1, rowsPerPage),
        api.getMonthlyPayments(orgId, selectedYear, selectedMonth),
      ]);
      setSummary(summaryRes);
      if (financeRes) {
        setFinance(financeRes);
        setMensalistaPriceStr(String(financeRes.mensalista_price));
        setDiaristaPriceStr(String(financeRes.diarista_price));
      }
      setTransactions(txData.data);
      setTotalTransactions(txData.total);
      setMonthlyPayments(mpRes);
    } catch (err) {
      console.error("Failed to fetch finance data", err);
      setError(
        t(
          "organizations.management.finance.error.load_failed",
          "Erro ao carregar dados financeiros",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [api, orgId, page, rowsPerPage, selectedYear, selectedMonth, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        mensalista_price: parseFloat(mensalistaPriceStr.replace(",", ".")),
        diarista_price: parseFloat(diaristaPriceStr.replace(",", ".")),
      };
      await api.updateOrganizationFinance(orgId, payload);
      setSuccess(t("organizations.management.finance.config.success"));
      await fetchData();
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

  const handleAddTransaction = async () => {
    if (!isAdmin) return;
    try {
      setSuccess(null);
      const amount = parseFloat(txAmountStr.replace(",", "."));
      await api.addTransaction(orgId, { ...newTx, amount });
      setIsTxDialogOpen(false);
      setTxAmountStr("0");
      setNewTx({
        type: "income",
        amount: 0,
        category: "other",
        payment_date: new Date().toISOString().split("T")[0],
      });
      await fetchData();
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

  const handleMarkPayment = async (player: MonthlyPayment, paid: boolean) => {
    if (!isAdmin) return;

    if (!paid) {
      setSelectedPayment(player);
      setConfirmReverseOpen(true);
      return;
    }

    try {
      setSuccess(null);
      await api.markMonthlyPayment(orgId, {
        player_id: player.player_id,
        year: selectedYear,
        month: selectedMonth,
        paid: true,
        amount: parseFloat(mensalistaPriceStr.replace(",", ".")),
        payment_date: new Date().toISOString().split("T")[0],
      });
      setSuccess(t("organizations.management.finance.monthly_fees.success"));
      await fetchData();
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
        amount: parseFloat(mensalistaPriceStr.replace(",", ".")),
        payment_date: new Date().toISOString().split("T")[0],
      });
      setSuccess(t("organizations.management.finance.monthly_fees.success"));
      setSelectedPayment(null);
      await fetchData();
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

  const handleReverseTransaction = async (txId: number) => {
    if (!isAdmin) return;
    try {
      setSuccess(null);
      await api.reverseTransaction(orgId, txId);
      setSuccess(
        t(
          "organizations.management.finance.transactions.reverse_success",
          "Transação estornada com sucesso!",
        ),
      );
      await fetchData();
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

  if (loading && !summary && transactions.length === 0)
    return <CircularProgress data-testid="finance-loading" />;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
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
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title={t("organizations.management.finance.summary.balance")}
            value={summary?.total_balance || 0}
            color={
              summary?.total_balance && summary.total_balance < 0
                ? "error.main"
                : "success.main"
            }
            icon={<AccountBalanceWalletIcon color="primary" />}
            testId="summary-balance"
            currency={finance?.currency}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title={t("organizations.management.finance.summary.income")}
            value={summary?.total_income || 0}
            color="success.main"
            icon={<TrendingUpIcon color="success" />}
            testId="summary-income"
            currency={finance?.currency}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title={t("organizations.management.finance.summary.expense")}
            value={summary?.total_expense || 0}
            color="error.main"
            icon={<TrendingDownIcon color="error" />}
            testId="summary-expense"
            currency={finance?.currency}
          />
        </Grid>
      </Grid>

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
        <Box data-testid="finance-panel-monthly">
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <TextField
              select
              label={t(
                "organizations.management.finance.monthly_fees.month_select",
              )}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              size="small"
              sx={{ minWidth: 120 }}
              SelectProps={{
                SelectDisplayProps: {
                  "data-testid": "month-select",
                } as React.HTMLAttributes<HTMLDivElement>,
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem
                  key={i + 1}
                  value={i + 1}
                  data-testid={`month-option-${i + 1}`}
                >
                  {new Date(0, i).toLocaleString("pt-BR", { month: "long" })}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t(
                "organizations.management.finance.monthly_fees.year_select",
              )}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              size="small"
              sx={{ minWidth: 100 }}
              SelectProps={{
                SelectDisplayProps: {
                  "data-testid": "year-select",
                } as React.HTMLAttributes<HTMLDivElement>,
              }}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <MenuItem key={y} value={y} data-testid={`year-option-${y}`}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    {t("organizations.management.finance.monthly_fees.player")}
                  </TableCell>
                  <TableCell align="center">
                    {t("organizations.management.finance.monthly_fees.status")}
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      {t("common.actions.title", "Ações")}
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyPayments.map((mp) => (
                  <TableRow
                    key={mp.player_id}
                    data-testid={`monthly-payment-row-${mp.player_id}`}
                  >
                    <TableCell>{mp.player_name}</TableCell>
                    <TableCell align="center">
                      {mp.paid ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={t(
                            "organizations.management.finance.monthly_fees.paid",
                          )}
                          color="success"
                          size="small"
                          data-testid="status-paid"
                        />
                      ) : (
                        <Chip
                          icon={<ErrorIcon />}
                          label={t(
                            "organizations.management.finance.monthly_fees.pending",
                          )}
                          color="warning"
                          size="small"
                          data-testid="status-pending"
                        />
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          color={mp.paid ? "error" : "success"}
                          onClick={() => handleMarkPayment(mp, !mp.paid)}
                          data-testid="mark-payment-button"
                        >
                          {mp.paid
                            ? t(
                                "organizations.management.finance.monthly_fees.reverse",
                              )
                            : t(
                                "organizations.management.finance.monthly_fees.mark_as_paid",
                              )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Transactions Tab */}
      {activeTab === 1 && (
        <Box data-testid="finance-panel-transactions">
          {isAdmin && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => setIsTxDialogOpen(true)}
                data-testid="add-transaction-button"
              >
                {t("organizations.management.finance.transactions.add_button")}
              </Button>
            </Box>
          )}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    {t("organizations.management.finance.transactions.date")}
                  </TableCell>
                  <TableCell>
                    {t(
                      "organizations.management.finance.transactions.description",
                    )}
                  </TableCell>
                  <TableCell>
                    {t(
                      "organizations.management.finance.transactions.category",
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {t("organizations.management.finance.transactions.amount")}
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      {t("common.actions.title", "Ações")}
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow key="empty-transactions">
                    <TableCell colSpan={5} align="center">
                      <Typography
                        variant="body2"
                        sx={{ py: 2, color: "text.secondary" }}
                      >
                        {t(
                          "organizations.management.finance.transactions.empty",
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow
                      key={
                        tx.id ||
                        `tx-${tx.payment_date}-${tx.amount}-${tx.description}`
                      }
                      data-testid={`transaction-row-${tx.id}`}
                      sx={{
                        opacity: tx.status === "reversed" ? 0.5 : 1,
                        bgcolor:
                          tx.status === "reversed" ? "action.hover" : "inherit",
                      }}
                    >
                      <TableCell
                        sx={{
                          textDecoration:
                            tx.status === "reversed" ? "line-through" : "none",
                        }}
                      >
                        {tx.payment_date
                          ? (() => {
                              const [year, month, day] =
                                tx.payment_date.split("-");
                              return new Date(
                                Number(year),
                                Number(month) - 1,
                                Number(day),
                              ).toLocaleDateString("pt-BR");
                            })()
                          : "-"}
                      </TableCell>
                      <TableCell
                        sx={{
                          textDecoration:
                            tx.status === "reversed" ? "line-through" : "none",
                        }}
                      >
                        <Typography variant="body2" fontWeight="medium">
                          {tx.description}
                          {tx.status === "reversed" &&
                            ` (${t("organizations.management.finance.transactions.reversed")})`}
                        </Typography>
                        {tx.player_name && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {t(
                              "organizations.management.finance.transactions.player",
                            )}
                            : {tx.player_name}
                          </Typography>
                        )}
                        {tx.creator_name && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="primary.main"
                            sx={{ fontStyle: "italic" }}
                          >
                            {t(
                              "organizations.management.finance.transactions.recorded_by",
                            )}
                            : {tx.creator_name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t(
                            `organizations.management.finance.categories.${tx.category}`,
                            tx.category,
                          )}
                          size="small"
                          variant="outlined"
                          disabled={tx.status === "reversed"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          fontWeight="bold"
                          color={
                            tx.status === "reversed"
                              ? "text.disabled"
                              : tx.type === "income"
                                ? "success.main"
                                : "error.main"
                          }
                          data-testid="transaction-amount"
                          sx={{
                            textDecoration:
                              tx.status === "reversed"
                                ? "line-through"
                                : "none",
                          }}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: finance?.currency || "BRL",
                          }).format(tx.amount)}
                        </Typography>
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          {tx.status === "paid" && (
                            <Tooltip
                              title={t(
                                "organizations.management.finance.transactions.mark_as_reversed",
                                "Estornar",
                              )}
                            >
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => handleReverseTransaction(tx.id)}
                                data-testid={`reverse-transaction-${tx.id}`}
                              >
                                <UndoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalTransactions}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={t("common.pagination.rows_per_page")}
          />
        </Box>
      )}

      {/* Config Tab */}
      {activeTab === 2 && finance && isAdmin && (
        <Box sx={{ maxWidth: 400 }} data-testid="finance-panel-config">
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                fullWidth
                label={t(
                  "organizations.management.finance.config.mensalista_price",
                )}
                value={mensalistaPriceStr}
                onChange={(e) => setMensalistaPriceStr(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {finance.currency}
                    </InputAdornment>
                  ),
                }}
                inputProps={{ "data-testid": "mensalista-price-input" }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label={t(
                  "organizations.management.finance.config.diarista_price",
                )}
                value={diaristaPriceStr}
                onChange={(e) => setDiaristaPriceStr(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {finance.currency}
                    </InputAdornment>
                  ),
                }}
                inputProps={{ "data-testid": "diarista-price-input" }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                select
                label={t("organizations.management.finance.config.currency")}
                value={finance.currency}
                onChange={(e) =>
                  setFinance({ ...finance, currency: e.target.value })
                }
                SelectProps={{
                  SelectDisplayProps: {
                    "data-testid": "currency-select",
                  } as React.HTMLAttributes<HTMLDivElement>,
                }}
              >
                <MenuItem value="BRL" data-testid="currency-option-BRL">
                  Real (BRL)
                </MenuItem>
                <MenuItem value="USD" data-testid="currency-option-USD">
                  Dollar (USD)
                </MenuItem>
                <MenuItem value="EUR" data-testid="currency-option-EUR">
                  Euro (EUR)
                </MenuItem>
              </TextField>
            </Grid>
            <Grid size={12}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleUpdateFinance}
                data-testid="save-finance-config-button"
              >
                {t("organizations.management.finance.config.save_button")}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Add Transaction Dialog */}
      <Dialog
        open={isTxDialogOpen}
        onClose={() => setIsTxDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        data-testid="add-transaction-dialog"
      >
        <DialogTitle>
          {t("organizations.management.finance.transactions.add_dialog.title")}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              select
              fullWidth
              label={t("organizations.management.finance.transactions.type")}
              value={newTx.type}
              onChange={(e) =>
                setNewTx({
                  ...newTx,
                  type: e.target.value as "income" | "expense",
                })
              }
              SelectProps={{
                SelectDisplayProps: {
                  "data-testid": "tx-type-select",
                } as React.HTMLAttributes<HTMLDivElement>,
              }}
            >
              <MenuItem value="income" data-testid="tx-type-income">
                {t(
                  "organizations.management.finance.transactions.add_dialog.income",
                )}
              </MenuItem>
              <MenuItem value="expense" data-testid="tx-type-expense">
                {t(
                  "organizations.management.finance.transactions.add_dialog.expense",
                )}
              </MenuItem>
            </TextField>
            <TextField
              fullWidth
              label={t("organizations.management.finance.transactions.amount")}
              value={txAmountStr}
              onChange={(e) => setTxAmountStr(e.target.value)}
              inputProps={{ "data-testid": "tx-amount-input" }}
            />
            <TextField
              select
              fullWidth
              label={t(
                "organizations.management.finance.transactions.category",
              )}
              value={newTx.category}
              onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
              SelectProps={{
                SelectDisplayProps: {
                  "data-testid": "tx-category-select",
                } as React.HTMLAttributes<HTMLDivElement>,
              }}
            >
              {(
                Object.keys(
                  t("organizations.management.finance.categories", {
                    returnObjects: true,
                  }),
                ) as string[]
              ).map((cat) => (
                <MenuItem
                  key={cat}
                  value={cat}
                  data-testid={`tx-category-option-${cat}`}
                >
                  {t(`organizations.management.finance.categories.${cat}`)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label={t(
                "organizations.management.finance.transactions.description",
              )}
              value={newTx.description || ""}
              onChange={(e) =>
                setNewTx({ ...newTx, description: e.target.value })
              }
              inputProps={{ "data-testid": "tx-description-input" }}
            />
            <TextField
              fullWidth
              label={t("organizations.management.finance.transactions.date")}
              type="date"
              value={newTx.payment_date}
              onChange={(e) =>
                setNewTx({ ...newTx, payment_date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              inputProps={{ "data-testid": "tx-date-input" }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTxDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleAddTransaction}
            variant="contained"
            disabled={!txAmountStr}
            data-testid="confirm-add-transaction-button"
          >
            {t("common.add")}
          </Button>
        </DialogActions>
      </Dialog>

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
    </Paper>
  );
}
