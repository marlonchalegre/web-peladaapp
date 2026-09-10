import { memo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import VideocamIcon from "@mui/icons-material/Videocam";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import type { Match, Player } from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { resolvePlayerName } from "../utils/playerUtils";

interface Props {
  match: Match;
  orgPlayerIdToUserId: Record<string, string>;
  userIdToName: Record<string, string>;
  orgPlayerIdToPlayer: Record<string, Player>;
  teamNameById: Record<string, string>;
  playerTeamMap: Record<string, string>;
  isAdmin: boolean;
  onNavigateToSupportTab?: () => void;
  onSwapRoles?: (match: Match) => Promise<void>;
}

function ActiveMatchSupportLineupCard({
  match,
  orgPlayerIdToUserId,
  userIdToName,
  orgPlayerIdToPlayer,
  teamNameById,
  playerTeamMap,
  isAdmin,
  onNavigateToSupportTab,
  onSwapRoles,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const getPlayerName = (playerId: string) =>
    resolvePlayerName(
      playerId,
      orgPlayerIdToPlayer,
      orgPlayerIdToUserId,
      userIdToName,
      `Player #${playerId.slice(0, 6)}`,
    );

  const camPlayerId = match.support_camera_player_id;
  const statsPlayerId = match.support_stats_player_id;

  const camUid = camPlayerId ? orgPlayerIdToUserId[camPlayerId] : undefined;
  const camPlayer = camPlayerId ? orgPlayerIdToPlayer[camPlayerId] : undefined;
  const camName = camPlayerId
    ? getPlayerName(camPlayerId)
    : t("peladas.support_lineup.unassigned", "Não definido");
  const camTeamName = camPlayerId
    ? teamNameById[playerTeamMap[camPlayerId]]
    : undefined;

  const statsUid = statsPlayerId
    ? orgPlayerIdToUserId[statsPlayerId]
    : undefined;
  const statsPlayer = statsPlayerId
    ? orgPlayerIdToPlayer[statsPlayerId]
    : undefined;
  const statsName = statsPlayerId
    ? getPlayerName(statsPlayerId)
    : t("peladas.support_lineup.unassigned", "Não definido");
  const statsTeamName = statsPlayerId
    ? teamNameById[playerTeamMap[statsPlayerId]]
    : undefined;

  return (
    <Paper
      elevation={0}
      data-testid="active-match-support-lineup-card"
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        gap: 1.5,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1.5, sm: 3 }}
        sx={{ alignItems: { xs: "flex-start", sm: "center" }, flex: 1 }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "text.secondary",
            fontSize: "0.7rem",
          }}
        >
          {t("peladas.support_lineup.active_match_title", "Suporte da Partida")}
          :
        </Typography>

        {/* Camera Player */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
            }}
          >
            <VideocamIcon sx={{ fontSize: "1.1rem" }} />
          </Box>
          {camPlayerId && (
            <SecureAvatar
              userId={camUid}
              filename={camPlayer?.user_avatar_filename}
              fallbackText={camName}
              sx={{ width: 26, height: 26 }}
            />
          )}
          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: "bold", fontSize: "0.85rem", lineHeight: 1.2 }}
            >
              {camName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.7rem" }}
            >
              {t("peladas.support_lineup.camera_short", "Câmera")}
              {camTeamName ? ` • ${camTeamName}` : ""}
            </Typography>
          </Box>
        </Stack>

        {/* Separator on desktop */}
        <Box
          sx={{
            display: { xs: "none", sm: "block" },
            width: "1px",
            height: 24,
            bgcolor: "divider",
          }}
        />

        {/* Stats Player */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              color: "secondary.main",
            }}
          >
            <AssignmentIcon sx={{ fontSize: "1.1rem" }} />
          </Box>
          {statsPlayerId && (
            <SecureAvatar
              userId={statsUid}
              filename={statsPlayer?.user_avatar_filename}
              fallbackText={statsName}
              sx={{ width: 26, height: 26 }}
            />
          )}
          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: "bold", fontSize: "0.85rem", lineHeight: 1.2 }}
            >
              {statsName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.7rem" }}
            >
              {t("peladas.support_lineup.stats_short", "Súmula")}
              {statsTeamName ? ` • ${statsTeamName}` : ""}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* Actions */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          justifyContent: { xs: "flex-end", sm: "center" },
        }}
      >
        {isAdmin && onSwapRoles && (camPlayerId || statsPlayerId) && (
          <Tooltip
            title={t(
              "peladas.support_lineup.swap_roles_button",
              "Inverter funções (Câmera ⇄ Súmula)",
            )}
          >
            <IconButton
              size="small"
              onClick={() => onSwapRoles(match)}
              data-testid="swap-active-support-roles"
              sx={{ border: "1px solid", borderColor: "divider", p: 0.5 }}
            >
              <SwapHorizIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {onNavigateToSupportTab && (
          <Button
            size="small"
            variant="text"
            onClick={onNavigateToSupportTab}
            endIcon={<OpenInNewIcon sx={{ fontSize: "0.85rem !important" }} />}
            data-testid="view-full-support-schedule"
            sx={{
              textTransform: "none",
              fontSize: "0.75rem",
              fontWeight: "bold",
              px: 1,
              py: 0.5,
              borderRadius: 1.5,
            }}
          >
            {t("peladas.support_lineup.view_full_schedule", "Ver escala")}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

export default memo(ActiveMatchSupportLineupCard);
