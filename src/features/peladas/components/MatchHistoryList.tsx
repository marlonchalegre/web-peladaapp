import {
  Paper,
  Box,
  Stack,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { type Match } from "../../../shared/api/endpoints";

interface MatchHistoryListProps {
  matches: Match[];
  selectedMatchId: number | null;
  onSelectMatch: (id: number) => void;
  teamNameById: Record<number, string>;
}

export default function MatchHistoryList({
  matches,
  selectedMatchId,
  onSelectMatch,
  teamNameById,
}: MatchHistoryListProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        {t("peladas.matches.history_title")}
      </Typography>
      <Paper variant="outlined" sx={{ flex: 1, overflowY: "auto" }}>
        <List component="nav" disablePadding>
          {matches.length === 0 && (
            <ListItemText
              sx={{ p: 2 }}
              primary={t("peladas.matches.empty_history")}
            />
          )}
          {matches.map((m) => {
            const isSelected = m.id === selectedMatchId;
            return (
              <Box key={m.id}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => onSelectMatch(m.id)}
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    borderLeftWidth: isSelected ? 4 : 0,
                    borderLeftStyle: "solid",
                    borderLeftColor: "primary.main",
                    py: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {t("peladas.matches.history_item_title", {
                      sequence: m.sequence,
                      teamName: teamNameById[m.home_team_id] || "Time",
                    })}
                  </Typography>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    width="100%"
                    alignItems="center"
                    sx={{ mt: 1 }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {teamNameById[m.home_team_id] ||
                        t("peladas.matches.team_fallback", {
                          id: m.home_team_id,
                        })}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ mx: 1 }}
                    >
                      {m.home_score ?? 0} x {m.away_score ?? 0}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {teamNameById[m.away_team_id] ||
                        t("peladas.matches.team_fallback", {
                          id: m.away_team_id,
                        })}
                    </Typography>
                  </Stack>
                </ListItemButton>
                <Divider />
              </Box>
            );
          })}
        </List>
      </Paper>
    </Box>
  );
}
