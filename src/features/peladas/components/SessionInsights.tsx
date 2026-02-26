import { Box, Typography, IconButton, Tooltip, Stack } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useTranslation } from "react-i18next";
import StandingsPanel, { type StandingRow } from "./StandingsPanel";
import PlayerStatsPanel, { type PlayerStatRow } from "./PlayerStatsPanel";
import { formatPeladaSummary } from "../utils/formatSummary";

interface SessionInsightsProps {
  standings: StandingRow[];
  playerStats: PlayerStatRow[];
  onToggleSort: (by: "goals" | "assists") => void;
  scheduledAt?: string | null;
}

export default function SessionInsights({
  standings,
  playerStats,
  onToggleSort,
  scheduledAt,
}: SessionInsightsProps) {
  const { t } = useTranslation();

  const handleShare = async () => {
    const text = formatPeladaSummary(
      scheduledAt || null,
      standings,
      playerStats,
    );

    if (navigator.share) {
      try {
        await navigator.share({
          title: t("peladas.matches.share_summary"),
          text: text,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert(t("peladas.matches.summary_copied"));
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  return (
    <Box sx={{ height: "100%", overflowY: "auto" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {t("peladas.matches.insights_title")}
        </Typography>
        <Tooltip title={t("peladas.matches.share_summary")}>
          <IconButton
            onClick={handleShare}
            color="primary"
            size="small"
            sx={{ border: 1, borderColor: "divider" }}
          >
            {typeof navigator.share !== "undefined" ? (
              <ShareIcon fontSize="small" />
            ) : (
              <ContentCopyIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Stack>
      <StandingsPanel standings={standings} />
      <PlayerStatsPanel playerStats={playerStats} onToggleSort={onToggleSort} />
    </Box>
  );
}
