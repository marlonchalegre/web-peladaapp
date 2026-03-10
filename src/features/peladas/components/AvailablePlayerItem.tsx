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
      data-testid="player-row"
      sx={{
        p: 1.25,
        display: "flex",
        alignItems: "center",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        cursor: locked ? "default" : "grab",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "primary.lighter",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          transform: "translateX(4px)",
        },
      }}
      draggable={!locked}
      onDragStart={locked ? undefined : onDragStart}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          fontSize: 14,
          bgcolor: "primary.main",
          color: "white",
          mr: 1.5,
          fontWeight: 800,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {getInitials(player.user.name)}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}
        >
          {player.user.name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {player.user.position
            ? t(`common.positions.${player.user.position.toLowerCase()}`)
            : t("common.positions.unknown")}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            px: 1,
            py: 0.25,
            bgcolor: "success.lighter",
            color: "success.main",
            fontWeight: 800,
            borderRadius: 1.5,
            fontSize: "0.75rem",
            border: "1px solid",
            borderColor: "success.light",
          }}
        >
          {scoreVal}
        </Box>
        {!locked && (
          <IconButton
            size="small"
            sx={{
              color: "primary.main",
              bgcolor: "primary.lighter",
              width: 24,
              height: 24,
              "&:hover": { bgcolor: "primary.light" },
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
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
