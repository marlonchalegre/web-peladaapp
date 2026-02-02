import { Paper, Box, Typography, Avatar, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { type Player, type User } from "../../../shared/api/endpoints";

interface AvailablePlayerItemProps {
  player: Player & { user: User };
  score: number | null;
  locked?: boolean;
  onDragStart: (e: DragEvent<HTMLElement>) => void;
}

export default function AvailablePlayerItem({
  player,
  score,
  locked,
  onDragStart,
}: AvailablePlayerItemProps) {
  const { t } = useTranslation();
  const scoreVal = typeof score === "number" ? score.toFixed(1) : "-";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        display: "flex",
        alignItems: "center",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        cursor: locked ? "default" : "grab",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "action.hover",
        },
      }}
      draggable={!locked}
      onDragStart={locked ? undefined : onDragStart}
    >
      <Avatar
        sx={{
          width: 40,
          height: 40,
          fontSize: 16,
          bgcolor: "warning.light",
          color: "warning.main",
          mr: 2,
          fontWeight: "bold",
        }}
      >
        {getInitials(player.user.name)}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          {player.user.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {player.user.position
            ? t(`common.positions.${player.user.position.toLowerCase()}`)
            : t("common.positions.unknown")}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: "bold", mr: 1, color: "text.primary" }}
        >
          {scoreVal}
        </Typography>
        {!locked && (
          <IconButton
            size="small"
            sx={{
              color: "primary.main",
              padding: "4px",
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
