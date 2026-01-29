import { useState, useMemo } from "react";
import {
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Stack,
  Button,
  LinearProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import type { DragEvent } from "react";
import type { Player, User } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";

type PlayerWithUser = Player & { user: User };

type AvailablePlayersPanelProps = {
  players: PlayerWithUser[];
  scores: Record<number, number>;
  onDropToBench: (e: DragEvent<HTMLElement>) => void;
  onDragStartPlayer: (e: DragEvent<HTMLElement>, playerId: number) => void;
  locked?: boolean;
  totalPlayersInPelada: number;
  averagePelada: number;
  balance: number;
};

function TechnicalSummary({
  totalPlayers,
  averagePelada,
  balance,
}: {
  totalPlayers: number;
  averagePelada: number;
  balance: number;
}) {
  const { t } = useTranslation();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: "primary.dark", // Deep blue
        color: "white",
        borderRadius: 4,
        mt: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <AutoGraphIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {t("peladas.panel.technical_summary.title")}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {t("peladas.panel.technical_summary.balance")}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {balance}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={balance}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: "rgba(255,255,255,0.2)",
            "& .MuiLinearProgress-bar": {
              bgcolor: "white",
            },
          }}
        />
      </Box>

      <Stack direction="row" spacing={4}>
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              opacity: 0.8,
              fontSize: "0.7rem",
              fontWeight: "bold",
            }}
          >
            {t("peladas.panel.technical_summary.total_players")}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {totalPlayers}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              opacity: 0.8,
              fontSize: "0.7rem",
              fontWeight: "bold",
            }}
          >
            {t("peladas.panel.technical_summary.average")}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {averagePelada.toFixed(1)}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function AvailablePlayersPanel({
  players,
  scores,
  onDropToBench,
  onDragStartPlayer,
  locked,
  totalPlayersInPelada,
  averagePelada,
  balance,
}: AvailablePlayersPanelProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filteredPlayers = useMemo(() => {
    if (!search) return players;
    const lower = search.toLowerCase();
    return players.filter((p) => p.user.name.toLowerCase().includes(lower));
  }, [players, search]);

  return (
    <Box sx={{ position: "relative" }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
        className={locked ? undefined : "droppable"}
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
                e.stopPropagation();
                const target = e.currentTarget;
                try {
                  await onDropToBench(e);
                } finally {
                  target.classList.remove("droppable--over");
                }
              }
        }
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mr: 1 }}>
              {t("peladas.panel.available.title")}
            </Typography>
            <Chip
              label={players.length}
              size="small"
              sx={{
                bgcolor: "action.hover",
                color: "text.secondary",
                fontWeight: "bold",
              }}
            />
          </Box>
        </Box>

        <TextField
          fullWidth
          placeholder={t("peladas.panel.available.filter_placeholder")}
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 2,
            bgcolor: "background.default",
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="disabled" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Stack spacing={1}>
          {filteredPlayers.map((p) => {
            const score = scores[p.id] ?? p.grade;
            const scoreVal = typeof score === "number" ? score.toFixed(1) : "-";

            return (
              <Paper
                key={p.id}
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
                onDragStart={
                  locked ? undefined : (e) => onDragStartPlayer(e, p.id)
                }
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    fontSize: 16,
                    bgcolor: "warning.light", // Light orange/yellow
                    color: "warning.main",
                    mr: 2,
                    fontWeight: "bold",
                  }}
                >
                  {getInitials(p.user.name)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {p.user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {/* Position placeholder */}
                    {p.position_id
                      ? t("common.positions.player")
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
          })}
        </Stack>

        <Button
          fullWidth
          variant="outlined"
          sx={{
            mt: 3,
            borderStyle: "dashed",
            textTransform: "none",
            color: "text.secondary",
          }}
        >
          {t("peladas.panel.available.invite_button")}
        </Button>
      </Paper>

      <TechnicalSummary
        totalPlayers={totalPlayersInPelada}
        averagePelada={averagePelada}
        balance={balance}
      />
    </Box>
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
