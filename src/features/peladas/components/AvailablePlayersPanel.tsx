import { useState, useMemo } from "react";
import {
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { DragEvent } from "react";
import type { Player, User } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";
import TechnicalSummary from "./TechnicalSummary";
import AvailablePlayerItem from "./AvailablePlayerItem";

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
    const result = search
      ? players.filter((p) =>
          p.user.name.toLowerCase().includes(search.toLowerCase()),
        )
      : [...players];

    const order: Record<string, number> = {
      Goalkeeper: 0,
      Defender: 1,
      Midfielder: 2,
      Striker: 3,
    };

    return result.sort((a, b) => {
      const posA = order[a.user?.position || ""] ?? 4;
      const posB = order[b.user?.position || ""] ?? 4;
      return posA - posB;
    });
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
          {filteredPlayers.map((p) => (
            <AvailablePlayerItem
              key={p.id}
              player={p}
              score={scores[p.id] ?? p.grade ?? null}
              locked={locked}
              onDragStart={(e) => onDragStartPlayer(e, p.id)}
            />
          ))}
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
