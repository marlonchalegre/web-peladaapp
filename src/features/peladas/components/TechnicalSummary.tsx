import { Paper, Box, Typography, LinearProgress, Stack } from "@mui/material";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import { useTranslation } from "react-i18next";

interface TechnicalSummaryProps {
  totalPlayers: number;
  averagePelada: number;
  balance: number;
}

export default function TechnicalSummary({
  totalPlayers,
  averagePelada,
  balance,
}: TechnicalSummaryProps) {
  const { t } = useTranslation();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: "primary.dark", // Deep blue
        color: "white",
        borderRadius: 4,
        mt: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <AutoGraphIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {t("peladas.panel.technical_summary.title")}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {t("peladas.panel.technical_summary.balance")}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {balance}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={balance}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.2)",
            "& .MuiLinearProgress-bar": {
              bgcolor: "white",
            },
          }}
        />
      </Box>

      <Stack direction="row" spacing={4}>
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              opacity: 0.8,
              fontSize: "0.7rem",
              fontWeight: "bold",
            }}
          >
            {t("peladas.panel.technical_summary.total_players")}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {totalPlayers}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              opacity: 0.8,
              fontSize: "0.7rem",
              fontWeight: "bold",
            }}
          >
            {t("peladas.panel.technical_summary.average")}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {averagePelada.toFixed(1)}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
