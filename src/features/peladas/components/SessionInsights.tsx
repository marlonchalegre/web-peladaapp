import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import StandingsPanel, { type StandingRow } from "./StandingsPanel";
import PlayerStatsPanel, { type PlayerStatRow } from "./PlayerStatsPanel";

interface SessionInsightsProps {
  standings: StandingRow[];
  playerStats: PlayerStatRow[];
  onToggleSort: (by: "goals" | "assists") => void;
}

export default function SessionInsights({
  standings,
  playerStats,
  onToggleSort,
}: SessionInsightsProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ height: "100%", overflowY: "auto" }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        {t("peladas.matches.insights_title")}
      </Typography>
      <StandingsPanel standings={standings} />
      <PlayerStatsPanel playerStats={playerStats} onToggleSort={onToggleSort} />
    </Box>
  );
}
