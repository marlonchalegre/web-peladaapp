import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SecurityIcon from "@mui/icons-material/Security";
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
  onDragStartPlayer: (
    e: DragEvent<HTMLElement>,
    playerId: number,
    sourceTeamId: number | null,
  ) => void;
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
      data-testid={`gk-slot-${side}`}
      sx={{
        p: 2.5,
        borderRadius: 4,
        bgcolor: player ? "primary.lighter" : "background.default",
        borderColor: player ? "primary.main" : "divider",
        borderStyle: player ? "solid" : "dashed",
        borderWidth: 2,
        minHeight: 110,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: player ? "0 4px 12px rgba(25, 118, 210, 0.1)" : "none",
        "&.droppable--over": {
          bgcolor: "primary.main",
          color: "white",
          borderColor: "primary.dark",
          transform: "scale(1.02)",
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
      <Box
        sx={{
          position: "absolute",
          top: -12,
          left: 20,
          bgcolor: "background.paper",
          px: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: player ? "primary.main" : "text.secondary",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {t(`peladas.teams.${side}_goalkeeper`)}
        </Typography>
      </Box>

      {player ? (
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          draggable={!locked}
          onDragStart={(e) => onDragStartPlayer(e, player.id, null)}
          sx={{ cursor: locked ? "default" : "grab" }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 48,
              height: 48,
              fontWeight: 800,
              fontSize: "1.2rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {player.user?.name?.[0].toUpperCase() || "G"}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, lineHeight: 1.2, color: "primary.dark" }}
            >
              {player.user?.name}
            </Typography>
            <Chip
              icon={<SecurityIcon style={{ fontSize: 12 }} />}
              label="ESPECIALISTA"
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: "0.65rem", fontWeight: 900, mt: 0.5 }}
            />
          </Box>
          {!locked && (
            <Tooltip title={t("common.delete")}>
              <IconButton
                size="small"
                onClick={() => onRemove(side)}
                sx={{
                  color: "error.main",
                  bgcolor: "rgba(211, 47, 47, 0.05)",
                  "&:hover": { bgcolor: "rgba(211, 47, 47, 0.1)" },
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "text.disabled",
          }}
        >
          <PersonAddIcon sx={{ mb: 0.5, fontSize: 28 }} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {t("peladas.teams.drag_gk_here")}
          </Typography>
        </Box>
      )}
    </Paper>
  );

  return (
    <Box sx={{ mb: 6 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <SecurityIcon fontSize="small" />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
          {t("peladas.teams.fixed_goalkeepers_title")}
        </Typography>
      </Stack>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>{renderSlot("home", homeGk)}</Grid>
        <Grid size={{ xs: 12, md: 6 }}>{renderSlot("away", awayGk)}</Grid>
      </Grid>
    </Box>
  );
}
