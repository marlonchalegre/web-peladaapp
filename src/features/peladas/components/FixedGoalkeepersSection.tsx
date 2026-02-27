import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Stack,
  Chip,
  IconButton,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useTranslation } from "react-i18next";
import type { Player, User } from "../../../shared/api/endpoints";
import type { DragEvent } from "react";

type PlayerWithUser = Player & { user: User };

interface FixedGoalkeepersSectionProps {
  homeGk: PlayerWithUser | null;
  awayGk: PlayerWithUser | null;
  onDrop: (e: DragEvent<HTMLElement>, side: "home" | "away") => Promise<void>;
  onRemove: (side: "home" | "away") => Promise<void>;
  locked?: boolean;
  onDragStartPlayer: (e: DragEvent<HTMLElement>, playerId: number) => void;
}

export default function FixedGoalkeepersSection({
  homeGk,
  awayGk,
  onDrop,
  onRemove,
  locked = false,
  onDragStartPlayer,
}: FixedGoalkeepersSectionProps) {
  const { t } = useTranslation();

  const renderSlot = (side: "home" | "away", player: PlayerWithUser | null) => (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 4,
        bgcolor: player ? "primary.light" : "background.paper",
        borderColor: player ? "primary.main" : "divider",
        borderStyle: player ? "solid" : "dashed",
        minHeight: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        transition: "all 0.2s",
        "&.droppable--over": {
          bgcolor: "primary.main",
          color: "white",
          borderColor: "primary.dark",
        },
      }}
      onDragOver={locked ? undefined : (e) => e.preventDefault()}
      onDragEnter={
        locked
          ? undefined
          : (e) => e.currentTarget.classList.add("droppable--over")
      }
      onDragLeave={
        locked
          ? undefined
          : (e) => e.currentTarget.classList.remove("droppable--over")
      }
      onDrop={
        locked
          ? undefined
          : async (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              try {
                await onDrop(e, side);
              } finally {
                target.classList.remove("droppable--over");
              }
            }
      }
    >
      <Typography
        variant="overline"
        sx={{
          fontWeight: "bold",
          color: player ? "primary.dark" : "text.secondary",
          mb: 1,
          display: "block",
          textAlign: "center",
        }}
      >
        {t(`peladas.teams.${side}_goalkeeper`)}
      </Typography>

      {player ? (
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          draggable={!locked}
          onDragStart={(e) => onDragStartPlayer(e, player.id)}
          sx={{ cursor: locked ? "default" : "grab" }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 40,
              height: 40,
              fontWeight: "bold",
            }}
          >
            {player.user?.name?.[0].toUpperCase() || "G"}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {player.user?.name}
            </Typography>
            <Chip
              label="GK"
              size="small"
              color="primary"
              sx={{ height: 18, fontSize: "0.6rem", fontWeight: "bold" }}
            />
          </Box>
          {!locked && (
            <IconButton
              size="small"
              onClick={() => onRemove(side)}
              sx={{ color: "primary.dark" }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "text.secondary",
            opacity: 0.7,
          }}
        >
          <PersonAddIcon sx={{ mb: 0.5 }} />
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {t("peladas.teams.drag_gk_here")}
          </Typography>
        </Box>
      )}
    </Paper>
  );

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
        {t("peladas.teams.fixed_goalkeepers_title")}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>{renderSlot("home", homeGk)}</Grid>
        <Grid size={{ xs: 12, md: 6 }}>{renderSlot("away", awayGk)}</Grid>
      </Grid>
    </Box>
  );
}
