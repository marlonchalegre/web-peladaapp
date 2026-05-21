import { Box, Card, CardContent, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useTranslation } from "react-i18next";

interface SummaryCardProps {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  testId: string;
  currency?: string;
  language?: string;
}

const SummaryCard = ({
  title,
  value,
  color,
  icon,
  testId,
  currency = "BRL",
  language = "pt-BR",
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
        <Typography
          gutterBottom
          variant="overline"
          sx={{
            color: "text.secondary",
          }}
        >
          {title}
        </Typography>
        {icon}
      </Box>
      <Typography
        variant="h5"
        color={color}
        data-testid={`${testId}-value`}
        data-amount={value}
        sx={{
          fontWeight: "bold",
        }}
      >
        {new Intl.NumberFormat(language, {
          style: "currency",
          currency: currency,
        }).format(value)}
      </Typography>
    </CardContent>
  </Card>
);

interface SummaryCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  currency?: string;
}

export default function SummaryCards({
  totalBalance,
  totalIncome,
  totalExpense,
  currency,
}: SummaryCardsProps) {
  const { t, i18n } = useTranslation();
  const language = i18n?.language || "pt-BR";

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SummaryCard
          title={t("organizations.management.finance.summary.balance")}
          value={totalBalance}
          color={totalBalance < 0 ? "error.main" : "success.main"}
          icon={<AccountBalanceWalletIcon color="primary" />}
          testId="summary-balance"
          currency={currency}
          language={language}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SummaryCard
          title={t("organizations.management.finance.summary.income")}
          value={totalIncome}
          color="success.main"
          icon={<TrendingUpIcon color="success" />}
          testId="summary-income"
          currency={currency}
          language={language}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <SummaryCard
          title={t("organizations.management.finance.summary.expense")}
          value={totalExpense}
          color="error.main"
          icon={<TrendingDownIcon color="error" />}
          testId="summary-expense"
          currency={currency}
          language={language}
        />
      </Grid>
    </Grid>
  );
}
