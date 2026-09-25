import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useTranslation } from "react-i18next";
import type { TeamPlayer, Player } from "../../../shared/api/endpoints";

const POSITION_SHORT: Record<string, string> = {
  goalkeeper: "GOL",
  defender: "ZAG",
  midfielder: "MEI",
  striker: "ATA",
};

interface MatchPlayerCardProps {
  player: TeamPlayer & { isEmpty?: boolean; side: "home" | "away" };
  playerName: string;
  playerData?: Player;
  stats: { goals: number; assists: number; ownGoals: number };
  finished: boolean;
  isAdmin: boolean;
  onSubClick: () => void;
  variant?: "mobile" | "desktop";
}

export default function MatchPlayerCard({
  player,
  playerName,
  playerData,
  stats,
  finished,
  isAdmin,
  onSubClick,
  variant = "mobile",
}: MatchPlayerCardProps) {
  const { t } = useTranslation();
  const isDesktop = variant === "desktop";
  const teamColor = player.side === "home" ? "home.main" : "away.main";

  const positionLabel = () => {
    if (player.is_goalkeeper) return POSITION_SHORT.goalkeeper;
    const pos = (
      playerData?.position ||
      playerData?.user_position ||
      ""
    ).toLowerCase();
    if (pos in POSITION_SHORT) return POSITION_SHORT[pos];
    return t(`common.positions.${pos || "player"}`).toUpperCase();
  };

  if (player.isEmpty) {
    return (
      <Box
        data-testid="player-row-empty"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          bgcolor: "transparent",
          border: (theme) => `1.5px dashed ${theme.palette.divider}`,
          borderRadius: "12px",
          px: isDesktop ? "12px" : "12px",
          py: isDesktop ? "10px" : "8px",
          minHeight: isDesktop ? 48 : 44,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <PersonAddIcon sx={{ fontSize: 16, color: "text.disabled" }} />
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              color: "text.disabled",
            }}
          >
            {t("peladas.dashboard.empty_slot", "Vaga disponível")}
          </Typography>
        </Stack>
        {isAdmin && !finished && (
          <IconButton
            onClick={onSubClick}
            size="small"
            data-testid="add-player-button"
            sx={{ color: teamColor, p: 0.5 }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>
    );
  }

  const swapButton = isDesktop ? (
    <IconButton
      onClick={onSubClick}
      data-testid="sub-button"
      aria-label={t("peladas.dashboard.live_state.swap_button", "Trocar")}
      sx={{
        flexShrink: 0,
        width: 26,
        height: 26,
        minWidth: 0,
        p: 0,
        borderRadius: "8px",
        border: (theme) => `1.5px solid ${theme.palette.divider}`,
        bgcolor: "action.hover",
        color: "text.secondary",
        fontFamily: "Archivo, sans-serif",
        fontWeight: 700,
        fontSize: "11px",
        lineHeight: 1,
        "&:hover": {
          borderColor: teamColor,
          color: teamColor,
          bgcolor: "action.selected",
        },
      }}
    >
      ⇄
    </IconButton>
  ) : (
    <Button
      onClick={onSubClick}
      data-testid="sub-button"
      sx={{
        flexShrink: 0,
        minWidth: 0,
        ml: "auto",
        border: (theme) => `1.5px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        color: "text.primary",
        borderRadius: "10px",
        px: "11px",
        py: "9px",
        fontFamily: "Archivo, sans-serif",
        fontWeight: 800,
        fontSize: "10px",
        lineHeight: 1,
        letterSpacing: "0.06em",
        "&:hover": {
          bgcolor: "action.hover",
          borderColor: teamColor,
          color: teamColor,
        },
      }}
    >
      ⇄ {t("peladas.dashboard.live_state.swap_button", "TROCAR")}
    </Button>
  );

  return (
    <Box
      data-testid={`player-row-${playerName}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: isDesktop ? "10px" : "9px",
        bgcolor: isDesktop ? "background.paper" : "background.default",
        border: "1.5px solid",
        borderColor: "divider",
        borderRadius: "12px",
        px: isDesktop ? "12px" : "8px",
        pl: isDesktop ? "12px" : "12px",
        py: isDesktop ? "10px" : "8px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Typography
          data-testid="player-name"
          noWrap
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: isDesktop ? "13px" : "12.5px",
            lineHeight: 1.2,
            color: "text.primary",
          }}
        >
          {playerName}
        </Typography>

        <Typography
          data-testid="player-position-label"
          sx={{
            flexShrink: 0,
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: isDesktop ? "9.5px" : "9px",
            letterSpacing: isDesktop ? "0.08em" : "0.06em",
            color: "text.secondary",
          }}
        >
          {positionLabel()}
        </Typography>
      </Box>

      {/* Live Match Stats: Goals, Assists, Own Goals */}
      {(stats.goals > 0 || stats.assists > 0 || stats.ownGoals > 0) && (
        <Box
          data-testid="player-stats-container"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flexShrink: 0,
          }}
        >
          {stats.goals > 0 && (
            <Typography
              data-testid="player-stat-goals"
              sx={{
                fontFamily: "ui-monospace, Menlo, monospace",
                fontWeight: 700,
                fontSize: isDesktop ? "11px" : "10px",
                lineHeight: 1,
                color: teamColor,
              }}
            >
              {stats.goals}G
            </Typography>
          )}
          {stats.assists > 0 && (
            <Typography
              data-testid="player-stat-assists"
              sx={{
                fontFamily: "ui-monospace, Menlo, monospace",
                fontWeight: 700,
                fontSize: isDesktop ? "11px" : "10px",
                lineHeight: 1,
                color: "primary.main",
              }}
            >
              {stats.assists}A
            </Typography>
          )}
          {stats.ownGoals > 0 && (
            <Typography
              data-testid="player-stat-own-goals"
              sx={{
                fontFamily: "ui-monospace, Menlo, monospace",
                fontWeight: 700,
                fontSize: isDesktop ? "11px" : "10px",
                lineHeight: 1,
                color: "secondary.main",
              }}
            >
              {stats.ownGoals}GC
            </Typography>
          )}
        </Box>
      )}

      {isAdmin && !finished && swapButton}
    </Box>
  );
}
