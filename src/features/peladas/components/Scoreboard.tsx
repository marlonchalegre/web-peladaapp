import { Paper, Typography, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

interface ScoreboardProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  sequence: number;
}

export default function Scoreboard({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  sequence,
}: ScoreboardProps) {
  const { t } = useTranslation();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        bgcolor: "primary.main",
        color: "white",
        borderRadius: 2,
        border: "none",
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.8 }}>
        {t("peladas.matches.history_item_title", {
          sequence: sequence,
          teamName: homeTeamName,
        })}
      </Typography>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 1, px: 4 }}
      >
        <Typography variant="h5" fontWeight="bold">
          {homeTeamName}
        </Typography>
        <Typography variant="h3" fontWeight="bold">
          {homeScore ?? 0} x {awayScore ?? 0}
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {awayTeamName}
        </Typography>
      </Stack>
    </Paper>
  );
}
