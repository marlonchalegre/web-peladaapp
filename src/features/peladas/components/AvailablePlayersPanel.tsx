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
import AddIcon from "@mui/icons-material/Add";
import type { DragEvent } from "react";
import type { Player, User } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";
import TechnicalSummary from "./TechnicalSummary";
import AvailablePlayerItem from "./AvailablePlayerItem";
import AddPlayersFromOrgDialog from "./AddPlayersFromOrgDialog";

type PlayerWithUser = Player & { user: User };

type AvailablePlayersPanelProps = {
  players: PlayerWithUser[];
  scores: Record<number, number>;
  onDropToBench: (e: DragEvent<HTMLElement>) => void;
  onDragStartPlayer: (e: DragEvent<HTMLElement>, playerId: number) => void;
  onAddPlayersFromOrg: (playerIds: number[]) => Promise<void>;
  organizationId: number;
  allPlayerIdsInPelada: number[];
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
  onAddPlayersFromOrg,
  organizationId,
  allPlayerIdsInPelada,
  locked,
  totalPlayersInPelada,
  averagePelada,
  balance,
}: AvailablePlayersPanelProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

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
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
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
            mb: 2.5,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, letterSpacing: -0.5 }}
            >
              {t("peladas.panel.available.title")}
            </Typography>
            <Chip
              label={players.length}
              size="small"
              sx={{
                bgcolor: "primary.main",
                color: "white",
                fontWeight: 900,
                fontSize: "0.7rem",
              }}
            />
          </Stack>
        </Box>

        <TextField
          fullWidth
          placeholder={t("peladas.panel.available.filter_placeholder")}
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "rgba(0,0,0,0.02)",
              transition: "all 0.2s",
              "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
              "&.Mui-focused": { bgcolor: "background.paper" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Stack spacing={1} sx={{ minHeight: 100 }}>
          {filteredPlayers.map((p) => (
            <AvailablePlayerItem
              key={p.id}
              player={p}
              score={scores[p.id] ?? p.grade ?? null}
              locked={locked}
              onDragStart={(e) => onDragStartPlayer(e, p.id)}
            />
          ))}
          {filteredPlayers.length === 0 && (
            <Typography
              variant="body2"
              color="text.disabled"
              align="center"
              sx={{ py: 4 }}
            >
              Nenhum jogador encontrado
            </Typography>
          )}
        </Stack>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          disabled={locked}
          sx={{
            mt: 3,
            borderStyle: "dashed",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "bold",
            py: 1,
            color: "primary.main",
            borderColor: "primary.light",
            "&:hover": {
              borderStyle: "dashed",
              bgcolor: "primary.lighter",
              borderColor: "primary.main",
            },
          }}
        >
          {t("peladas.panel.available.invite_button")}
        </Button>
      </Paper>

      <AddPlayersFromOrgDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={onAddPlayersFromOrg}
        organizationId={organizationId}
        excludePlayerIds={allPlayerIdsInPelada}
      />

      <TechnicalSummary
        totalPlayers={totalPlayersInPelada}
        averagePelada={averagePelada}
        balance={balance}
      />
    </Box>
  );
}
