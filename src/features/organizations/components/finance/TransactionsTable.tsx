import {
  Box,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UndoIcon from "@mui/icons-material/Undo";
import { useTranslation } from "react-i18next";
import type { Transaction } from "../../../../shared/api/endpoints";

interface TransactionsTableProps {
  transactions: Transaction[];
  totalTransactions: number;
  rowsPerPage: number;
  page: number;
  isAdmin: boolean;
  currency: string;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddTransactionClick: () => void;
  onReverseTransactionClick: (txId: string) => void;
}

export default function TransactionsTable({
  transactions,
  totalTransactions,
  rowsPerPage,
  page,
  isAdmin,
  currency,
  onPageChange,
  onRowsPerPageChange,
  onAddTransactionClick,
  onReverseTransactionClick,
}: TransactionsTableProps) {
  const { t, i18n } = useTranslation();
  const language = i18n?.language || "pt-BR";

  return (
    <Box data-testid="finance-panel-transactions">
      {isAdmin && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={onAddTransactionClick}
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
                {t("organizations.management.finance.transactions.description")}
              </TableCell>
              <TableCell>
                {t("organizations.management.finance.transactions.category")}
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
                    {t("organizations.management.finance.transactions.empty")}
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
                          const [year, month, day] = tx.payment_date.split("-");
                          return new Date(
                            Number(year),
                            Number(month) - 1,
                            Number(day),
                          ).toLocaleDateString(language);
                        })()
                      : "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      textDecoration:
                        tx.status === "reversed" ? "line-through" : "none",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "medium",
                      }}
                    >
                      {(() => {
                        if (
                          tx.description &&
                          tx.pelada_id &&
                          tx.description.includes(tx.pelada_id) &&
                          tx.pelada_date
                        ) {
                          const dateStr = new Date(
                            tx.pelada_date,
                          ).toLocaleDateString(language);
                          return tx.description.replace(tx.pelada_id, dateStr);
                        }
                        return tx.description;
                      })()}
                      {tx.status === "reversed" &&
                        ` (${t("organizations.management.finance.transactions.reversed")})`}
                    </Typography>
                    {tx.player_name && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: "text.secondary",
                        }}
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
                        sx={{
                          display: "block",
                          color: "primary.main",
                          fontStyle: "italic",
                        }}
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
                      color={
                        tx.status === "reversed"
                          ? "text.disabled"
                          : tx.type === "income"
                            ? "success.main"
                            : "error.main"
                      }
                      data-testid="transaction-amount"
                      sx={{
                        fontWeight: "bold",
                        textDecoration:
                          tx.status === "reversed" ? "line-through" : "none",
                      }}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {new Intl.NumberFormat(language, {
                        style: "currency",
                        currency: currency || "BRL",
                      }).format(tx.amount)}
                    </Typography>
                    {tx.category === "monthly_fee" &&
                      tx.fine_amount &&
                      tx.fine_amount > 0 && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{
                            display: "block",
                            textDecoration:
                              tx.status === "reversed"
                                ? "line-through"
                                : "none",
                          }}
                        >
                          (inclui{" "}
                          {new Intl.NumberFormat(language, {
                            style: "currency",
                            currency: currency || "BRL",
                          }).format(tx.fine_amount)}{" "}
                          multa)
                        </Typography>
                      )}
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
                            onClick={() => onReverseTransactionClick(tx.id)}
                            data-testid={`reverse-transaction-${tx.id}`}
                            data-testclass="reverse-transaction-button"
                          >
                            <UndoIcon
                              fontSize="small"
                              data-testid="undo-icon"
                            />
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
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage={t("common.pagination.rows_per_page")}
      />
    </Box>
  );
}
