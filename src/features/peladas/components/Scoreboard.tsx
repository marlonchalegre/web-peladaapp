import { Paper, Typography, Stack, Box } from "@mui/material";
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
        p: 0,
        color: "white",
        borderRadius: 2,
        border: "none",
        overflow: "hidden",
        background: (theme) =>
          `linear-gradient(90deg, ${theme.palette.home.main} 50%, ${theme.palette.away.main} 50%)`,
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {t("peladas.matches.history_item_title", {
            sequence: sequence,
            teamName: homeTeamName,
          })}
        </Typography>
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mt: 1,
            px: 4,
          }}
        >
          <Stack
            sx={{
              alignItems: "center",
            }}
          >
            <Typography variant="overline" sx={{ opacity: 0.9, lineHeight: 1 }}>
              HOME
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
              }}
            >
              {homeTeamName}
            </Typography>
          </Stack>

          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              px: 2,
            }}
          >
            {homeScore ?? 0} x {awayScore ?? 0}
          </Typography>

          <Stack
            sx={{
              alignItems: "center",
            }}
          >
            <Typography variant="overline" sx={{ opacity: 0.9, lineHeight: 1 }}>
              AWAY
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
              }}
            >
              {awayTeamName}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}
