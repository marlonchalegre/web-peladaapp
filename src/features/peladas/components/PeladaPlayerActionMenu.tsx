import {
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import GroupsIcon from "@mui/icons-material/Groups";
import SecurityIcon from "@mui/icons-material/Security";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { useTranslation } from "react-i18next";
import type { Team } from "../../../shared/api/endpoints";
import type { PlayerWithUser } from "./TeamsSection";

type DesktopPlayerActionMenuProps = {
  anchorEl: HTMLElement | null;
  activePlayerForMenu: {
    player: PlayerWithUser;
    sourceTeamId: string | null;
  } | null;
  teams: Team[];
  fixedGoalkeepers: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSendToBench: (playerId: string) => void;
  onMoveToTeam: (playerId: string, targetTeamId: string) => void;
  onMoveToFixedGk: (playerId: string, side: "home" | "away") => void;
  onRemovePlayerFromPelada?: (player: PlayerWithUser) => void;
};

export function DesktopPlayerActionMenu({
  anchorEl,
  activePlayerForMenu,
  teams,
  fixedGoalkeepers,
  isAdmin,
  onClose,
  onSendToBench,
  onMoveToTeam,
  onMoveToFixedGk,
  onRemovePlayerFromPelada,
}: DesktopPlayerActionMenuProps) {
  const { t } = useTranslation();

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl && activePlayerForMenu)}
      onClose={onClose}
    >
      {activePlayerForMenu?.sourceTeamId && (
        <MenuItem
          onClick={() => {
            onSendToBench(activePlayerForMenu.player.id);
            onClose();
          }}
        >
          <ListItemIcon>
            <ArrowDownwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("peladas.teams.menu.send_to_bench", "Enviar para o Banco")}
          </ListItemText>
        </MenuItem>
      )}
      {teams
        .filter((team) => team.id !== activePlayerForMenu?.sourceTeamId)
        .map((targetTeam) => (
          <MenuItem
            key={targetTeam.id}
            onClick={() => {
              if (activePlayerForMenu) {
                onMoveToTeam(activePlayerForMenu.player.id, targetTeam.id);
              }
              onClose();
            }}
          >
            <ListItemIcon>
              <GroupsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {t("peladas.teams.menu.move_to", {
                name: targetTeam.name,
                defaultValue: `Mover para ${targetTeam.name}`,
              })}
            </ListItemText>
          </MenuItem>
        ))}
      {fixedGoalkeepers && [
        <MenuItem
          key="home-gk"
          data-testid="move-to-home-gk-item"
          onClick={() => {
            if (activePlayerForMenu) {
              onMoveToFixedGk(activePlayerForMenu.player.id, "home");
            }
            onClose();
          }}
        >
          <ListItemIcon>
            <SecurityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("peladas.teams.menu.move_to_home_gk", "Goleiro Time 1")}
          </ListItemText>
        </MenuItem>,
        <MenuItem
          key="away-gk"
          data-testid="move-to-away-gk-item"
          onClick={() => {
            if (activePlayerForMenu) {
              onMoveToFixedGk(activePlayerForMenu.player.id, "away");
            }
            onClose();
          }}
        >
          <ListItemIcon>
            <SecurityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("peladas.teams.menu.move_to_away_gk", "Goleiro Time 2")}
          </ListItemText>
        </MenuItem>,
      ]}
      {isAdmin &&
        onRemovePlayerFromPelada && [
          <Divider key="remove-player-divider" />,
          <MenuItem
            key="remove-player-item"
            data-testid="menu-remove-player-item"
            onClick={() => {
              if (activePlayerForMenu) {
                onRemovePlayerFromPelada(activePlayerForMenu.player);
              }
              onClose();
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon sx={{ color: "error.main" }}>
              <PersonRemoveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {t("peladas.teams.menu.remove_from_pelada", "Remover da pelada")}
            </ListItemText>
          </MenuItem>,
        ]}
    </Menu>
  );
}

type MobilePlayerActionMenuProps = {
  anchorEl: HTMLElement | null;
  selectedPlayer: {
    player: PlayerWithUser;
    currentTeamId: string | null;
  } | null;
  teams: Team[];
  isAdmin: boolean;
  onClose: () => void;
  onMoveToTeam: (playerId: string, teamId: string) => void;
  onSendToBench: (playerId: string) => void;
  onRemovePlayerFromPelada?: (player: PlayerWithUser) => void;
};

export function MobilePlayerActionMenu({
  anchorEl,
  selectedPlayer,
  teams,
  isAdmin,
  onClose,
  onMoveToTeam,
  onSendToBench,
  onRemovePlayerFromPelada,
}: MobilePlayerActionMenuProps) {
  const { t } = useTranslation();

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            border: "1.5px solid",
            borderColor: "divider",
            minWidth: 200,
          },
        },
      }}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "12px",
            color: "text.primary",
          }}
        >
          {selectedPlayer?.player.user?.name}
        </Typography>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 600,
            fontSize: "10px",
            color: "text.secondary",
          }}
        >
          {t("peladas.teams.move_player_to", "Mover jogador para:")}
        </Typography>
      </Box>
      <Divider />

      {teams.map((tItem, idx) => {
        if (tItem.id === selectedPlayer?.currentTeamId) return null;
        return (
          <MenuItem
            key={tItem.id}
            onClick={() => {
              if (selectedPlayer) {
                onMoveToTeam(selectedPlayer.player.id, tItem.id);
              }
              onClose();
            }}
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "12px",
              color: "text.primary",
            }}
          >
            {tItem.name ||
              t("peladas.teams.team_n_mixed", "Time {{n}}", {
                n: idx + 1,
              })}
          </MenuItem>
        );
      })}

      {selectedPlayer?.currentTeamId !== null && (
        <MenuItem
          onClick={() => {
            if (selectedPlayer) {
              onSendToBench(selectedPlayer.player.id);
            }
            onClose();
          }}
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "12px",
            color: "secondary.main",
          }}
        >
          {t("peladas.teams.send_to_bench", "Enviar para o banco")}
        </MenuItem>
      )}

      {isAdmin &&
        onRemovePlayerFromPelada && [
          <Divider key="mobile-remove-divider" />,
          <MenuItem
            key="mobile-remove-player-item"
            data-testid="mobile-menu-remove-player-item"
            onClick={() => {
              if (selectedPlayer) {
                onRemovePlayerFromPelada(selectedPlayer.player);
              }
              onClose();
            }}
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "12px",
              color: "error.main",
            }}
          >
            <ListItemIcon sx={{ color: "error.main", minWidth: 28 }}>
              <PersonRemoveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {t("peladas.teams.menu.remove_from_pelada", "Remover da pelada")}
            </ListItemText>
          </MenuItem>,
        ]}
    </Menu>
  );
}
