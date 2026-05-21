import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Transaction } from "../../../../shared/api/endpoints";

interface AddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onAddTransaction: (newTx: {
    type: "income" | "expense";
    amount: number;
    category: string;
    description: string;
    payment_date: string;
  }) => Promise<void>;
}

export default function AddTransactionDialog({
  open,
  onClose,
  onAddTransaction,
}: AddTransactionDialogProps) {
  const { t } = useTranslation();
  const [txAmountStr, setTxAmountStr] = useState("0");
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: "income",
    amount: 0,
    category: "other",
    payment_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    if (open) {
      setTxAmountStr("0");
      setNewTx({
        type: "income",
        amount: 0,
        category: "other",
        payment_date: new Date().toISOString().split("T")[0],
        description: "",
      });
    }
  }, [open]);

  const handleAdd = async () => {
    const amount = Number(String(txAmountStr).replace(",", "."));
    await onAddTransaction({
      type: newTx.type as "income" | "expense",
      amount,
      category: newTx.category || "other",
      description: newTx.description || "",
      payment_date:
        newTx.payment_date || new Date().toISOString().split("T")[0],
    });
  };

  const categories = Object.keys(
    t("organizations.management.finance.categories", {
      returnObjects: true,
    }) || {},
  ) as string[];

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
            slotProps={{
              select: {
                SelectDisplayProps: {
                  "data-testid": "tx-type-select",
                } as React.HTMLAttributes<HTMLDivElement>,
              },
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
            slotProps={{
              htmlInput: { "data-testid": "tx-amount-input" },
            }}
          />
          <TextField
            select
            fullWidth
            label={t("organizations.management.finance.transactions.category")}
            value={newTx.category}
            onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
            slotProps={{
              select: {
                SelectDisplayProps: {
                  "data-testid": "tx-category-select",
                } as React.HTMLAttributes<HTMLDivElement>,
              },
            }}
          >
            {categories.map((cat) => (
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
            slotProps={{
              htmlInput: { "data-testid": "tx-description-input" },
            }}
          />
          <TextField
            fullWidth
            label={t("organizations.management.finance.transactions.date")}
            type="date"
            value={newTx.payment_date}
            onChange={(e) =>
              setNewTx({ ...newTx, payment_date: e.target.value })
            }
            slotProps={{
              htmlInput: { "data-testid": "tx-date-input" },
              inputLabel: { shrink: true },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          disabled={!txAmountStr}
          data-testid="confirm-add-transaction-button"
        >
          {t("common.add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
