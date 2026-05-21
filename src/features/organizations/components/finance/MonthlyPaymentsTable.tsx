import {
  Box,
  Button,
  Chip,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useTranslation } from "react-i18next";
import type { MonthlyPayment } from "../../../../shared/api/endpoints";
import { calculateMonthlyFine } from "./utils";

interface MonthlyPaymentsTableProps {
  monthlyPayments: MonthlyPayment[];
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  isAdmin: boolean;
  mensalistaPrice: number;
  monthlyFineAmount: number;
  monthlyCutOffDay: number;
  currency: string;
  onMarkPayment: (player: MonthlyPayment, paid: boolean) => void;
}

export default function MonthlyPaymentsTable({
  monthlyPayments,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  isAdmin,
  mensalistaPrice,
  monthlyFineAmount,
  monthlyCutOffDay,
  currency,
  onMarkPayment,
}: MonthlyPaymentsTableProps) {
  const { t, i18n } = useTranslation();
  const language = i18n?.language || "pt-BR";

  return (
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
          slotProps={{
            select: {
              SelectDisplayProps: {
                "data-testid": "month-select",
              } as React.HTMLAttributes<HTMLDivElement>,
            },
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <MenuItem
              key={i + 1}
              value={i + 1}
              data-testid={`month-option-${i + 1}`}
            >
              {new Date(0, i).toLocaleString(language, {
                month: "long",
              })}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t("organizations.management.finance.monthly_fees.year_select")}
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 100 }}
          slotProps={{
            select: {
              SelectDisplayProps: {
                "data-testid": "year-select",
              } as React.HTMLAttributes<HTMLDivElement>,
            },
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
              <TableCell align="right">
                {t(
                  "organizations.management.finance.monthly_fees.amount",
                  "Valor",
                )}
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
                <TableCell align="right">
                  {(() => {
                    const baseAmount = Number(mensalistaPrice || 0);
                    // If already paid, use stored fine_amount.
                    // Otherwise calculate what it would be today.
                    const fine = mp.paid
                      ? mp.fine_status === "reversed"
                        ? 0
                        : Number(mp.fine_amount || 0)
                      : calculateMonthlyFine(
                          selectedYear,
                          selectedMonth,
                          new Date().toISOString().split("T")[0],
                          Number(monthlyFineAmount || 0),
                          Number(monthlyCutOffDay || 5),
                        );

                    const total =
                      mp.paid && mp.amount !== undefined
                        ? mp.fine_status === "reversed"
                          ? Number(mp.amount)
                          : Number(mp.amount) + Number(fine)
                        : Number(baseAmount) + Number(fine);

                    return (
                      <Box>
                        <Typography variant="body2">
                          {new Intl.NumberFormat(language, {
                            style: "currency",
                            currency: currency || "BRL",
                          }).format(total)}
                        </Typography>
                        {Number(fine) > 0 && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: "block" }}
                          >
                            +{" "}
                            {new Intl.NumberFormat(language, {
                              style: "currency",
                              currency: currency || "BRL",
                            }).format(fine)}{" "}
                            (multa)
                          </Typography>
                        )}
                      </Box>
                    );
                  })()}
                </TableCell>
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
                      onClick={() => onMarkPayment(mp, !mp.paid)}
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
  );
}
