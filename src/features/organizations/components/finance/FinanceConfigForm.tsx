import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import SaveIcon from "@mui/icons-material/Save";
import { useTranslation } from "react-i18next";

interface FinanceConfigFormProps {
  mensalistaPriceStr: string;
  setMensalistaPriceStr: (val: string) => void;
  diaristaPriceStr: string;
  setDiaristaPriceStr: (val: string) => void;
  monthlyFineAmountStr: string;
  setMonthlyFineAmountStr: (val: string) => void;
  monthlyCutOffDay: number;
  setMonthlyCutOffDay: (val: number) => void;
  currency: string;
  setCurrency: (val: string) => void;
  onUpdateFinance: () => void;
}

export default function FinanceConfigForm({
  mensalistaPriceStr,
  setMensalistaPriceStr,
  diaristaPriceStr,
  setDiaristaPriceStr,
  monthlyFineAmountStr,
  setMonthlyFineAmountStr,
  monthlyCutOffDay,
  setMonthlyCutOffDay,
  currency,
  setCurrency,
  onUpdateFinance,
}: FinanceConfigFormProps) {
  const { t } = useTranslation();

  return (
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
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">{currency}</InputAdornment>
                ),
              },
              htmlInput: { "data-testid": "mensalista-price-input" },
            }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            label={t("organizations.management.finance.config.diarista_price")}
            value={diaristaPriceStr}
            onChange={(e) => setDiaristaPriceStr(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">{currency}</InputAdornment>
                ),
              },
              htmlInput: { "data-testid": "diarista-price-input" },
            }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            label={t(
              "organizations.management.finance.config.monthly_fine_amount",
              "Valor da Multa (Mensalidade)",
            )}
            value={monthlyFineAmountStr}
            onChange={(e) => setMonthlyFineAmountStr(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">{currency}</InputAdornment>
                ),
              },
              htmlInput: { "data-testid": "monthly-fine-amount-input" },
            }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            type="number"
            label={t(
              "organizations.management.finance.config.monthly_cut_off_day",
              "Dia Limite para Pagamento",
            )}
            value={monthlyCutOffDay}
            onChange={(e) => setMonthlyCutOffDay(Number(e.target.value))}
            slotProps={{
              htmlInput: {
                "data-testid": "monthly-cut-off-day-input",
                min: 1,
                max: 28,
              },
            }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            select
            label={t("organizations.management.finance.config.currency")}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            slotProps={{
              select: {
                SelectDisplayProps: {
                  "data-testid": "currency-select",
                } as React.HTMLAttributes<HTMLDivElement>,
              },
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
            onClick={onUpdateFinance}
            data-testid="save-finance-config-button"
          >
            {t("organizations.management.finance.config.save_button")}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
