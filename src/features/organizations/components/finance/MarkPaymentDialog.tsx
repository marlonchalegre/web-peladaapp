import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { MonthlyPayment } from "../../../../shared/api/endpoints";

interface MarkPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  playerToMark: MonthlyPayment | null;
  fineAmountStr: string;
  currency: string;
  onConfirm: (player: MonthlyPayment, shouldApplyFine: boolean) => void;
}

export default function MarkPaymentDialog({
  open,
  onClose,
  playerToMark,
  fineAmountStr,
  currency,
  onConfirm,
}: MarkPaymentDialogProps) {
  const { t, i18n } = useTranslation();
  const language = i18n?.language || "pt-BR";
  const [shouldApplyFine, setShouldApplyFine] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldApplyFine(true);
    }
  }, [open]);

  const handleConfirm = () => {
    if (playerToMark) {
      onConfirm(playerToMark, shouldApplyFine);
    }
  };

  const fineFormatted = new Intl.NumberFormat(language, {
    style: "currency",
    currency: currency || "BRL",
  }).format(parseFloat(fineAmountStr.replace(",", ".")) || 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      data-testid="mark-payment-dialog"
    >
      <DialogTitle>
        {t(
          "organizations.management.finance.monthly_fees.mark_paid_title",
          "Confirmar Pagamento",
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body1" gutterBottom>
            {t(
              "organizations.management.finance.monthly_fees.mark_paid_confirm",
              {
                player: playerToMark?.player_name,
              },
            )}
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={shouldApplyFine}
                onChange={(e) => setShouldApplyFine(e.target.checked)}
                data-testid="apply-fine-checkbox"
              />
            }
            label={t(
              "organizations.management.finance.monthly_fees.apply_fine_label",
              "Aplicar multa de {{amount}}",
              {
                amount: fineFormatted,
              },
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          data-testid="confirm-mark-payment-button"
        >
          {t("common.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
