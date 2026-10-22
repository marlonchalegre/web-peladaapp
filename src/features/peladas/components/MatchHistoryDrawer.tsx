import {
  Avatar,
  Box,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Match } from "../../../shared/api/endpoints";

type Props = {
  open: boolean;
  onClose: () => void;
  matches: Match[];
  selectedMatchId: string;
  currentMatchId?: string | null;
  teamNameById: Record<string, string>;
  onSelectMatch: (id: string) => void;
};

export default function MatchHistoryDrawer({
  open,
  onClose,
  matches,
  selectedMatchId,
  currentMatchId,
  teamNameById,
  onSelectMatch,
}: Props) {
  const { t } = useTranslation();

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      data-testid="history-drawer"
    >
      <Box sx={{ width: 320, p: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: "bold",
            mb: 3,
            px: 1,
          }}
        >
          {t("peladas.matches.history_title", "Histórico de Partidas")}
        </Typography>
        <List sx={{ px: 0 }}>
          {matches.map((m) => {
            const isSelected = selectedMatchId === m.id;
            const isCurrent = currentMatchId === m.id;
            const status =
              m.status === "finished"
                ? "finished"
                : m.status === "running"
                  ? "running"
                  : isCurrent
                    ? "next"
                    : "scheduled";

            const statusColor =
              status === "finished"
                ? "success"
                : status === "running" || status === "next"
                  ? "primary"
                  : "default";

            return (
              <ListItem key={m.id} disablePadding sx={{ mb: 1.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    onSelectMatch(m.id);
                    onClose();
                  }}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: isSelected ? "primary.main" : "divider",
                    bgcolor: isSelected ? "primary.lighter" : "transparent",
                    flexDirection: "column",
                    alignItems: "stretch",
                    gap: 1,
                    p: 1.5,
                    "&:hover": {
                      bgcolor: isSelected ? "primary.lighter" : "action.hover",
                    },
                  }}
                  data-testid={`match-history-item-${m.sequence}`}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                      width: "100%",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.75rem",
                          bgcolor: isSelected
                            ? "primary.main"
                            : "text.secondary",
                          fontWeight: "bold",
                        }}
                      >
                        {m.sequence}
                      </Avatar>
                      <Typography
                        variant="caption"
                        color={isSelected ? "primary.main" : "text.secondary"}
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: "bold",
                        }}
                      >
                        {t("peladas.matches.match_label", {
                          seq: m.sequence,
                        }).toUpperCase()}
                      </Typography>
                    </Stack>
                    <Chip
                      label={t(`peladas.matches.status.${status}`)}
                      size="small"
                      color={statusColor}
                      variant={status === "running" ? "filled" : "outlined"}
                      sx={{
                        height: 20,
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        textAlign: "right",
                        fontWeight: m.home_score > m.away_score ? 800 : 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {teamNameById[m.home_team_id] || "Home"}
                    </Typography>

                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: "action.selected",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        minWidth: 60,
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "900" }}>
                        {m.home_score}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.disabled", fontWeight: "bold" }}
                      >
                        x
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "900" }}>
                        {m.away_score}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        textAlign: "left",
                        fontWeight: m.away_score > m.home_score ? 800 : 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {teamNameById[m.away_team_id] || "Away"}
                    </Typography>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}
