import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  ListItemButton,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useTranslation } from "react-i18next";
import { type Player, type User } from "../../../shared/api/endpoints";
import { sortPlayersByPosition } from "../utils/playerUtils";

type PlayerWithUser = Player & { user: User };

interface SwapPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  incomingPlayer: PlayerWithUser | null;
  targetTeamName: string;
  targetTeamPlayers: PlayerWithUser[];
  onSwap: (playerToReplaceId: number) => void;
}

export default function SwapPlayerDialog({
  open,
  onClose,
  incomingPlayer,
  targetTeamName,
  targetTeamPlayers,
  onSwap,
}: SwapPlayerDialogProps) {
  const { t } = useTranslation();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const sortedPlayers = sortPlayersByPosition(targetTeamPlayers);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: "bold" }}>
        {t("peladas.dialog.swap.title", "Substitute Player")}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          {t("peladas.dialog.swap.description", {
            incomingPlayer: incomingPlayer?.user.name,
            teamName: targetTeamName,
          })}
        </Typography>
        <List sx={{ pt: 0 }}>
          {sortedPlayers.map((player) => {
            const isSamePosition =
              incomingPlayer?.user.position &&
              player.user.position &&
              incomingPlayer.user.position.toLowerCase() ===
                player.user.position.toLowerCase();

            return (
              <ListItem disableGutters key={player.id}>
                <ListItemButton
                  onClick={() => onSwap(player.id)}
                  sx={{
                    borderRadius: 2,
                    border: isSamePosition
                      ? "1px solid"
                      : "1px solid transparent",
                    borderColor: isSamePosition
                      ? "primary.light"
                      : "transparent",
                    bgcolor: isSamePosition ? "primary.lighter" : "transparent",
                    "&:hover": {
                      bgcolor: isSamePosition
                        ? "primary.lighter"
                        : "action.hover",
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: isSamePosition ? "primary.main" : "grey.400",
                        width: 32,
                        height: 32,
                        fontSize: "0.85rem",
                      }}
                    >
                      {getInitials(player.user.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: isSamePosition ? 800 : 500 }}
                        >
                          {player.user.name}
                        </Typography>
                        {isSamePosition && (
                          <CheckCircleIcon
                            sx={{
                              fontSize: "1rem",
                              color: "primary.main",
                              opacity: 0.8,
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      player.user.position
                        ? t(
                            `common.positions.${player.user.position.toLowerCase()}`,
                          )
                        : ""
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} color="inherit">
          {t("common.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
