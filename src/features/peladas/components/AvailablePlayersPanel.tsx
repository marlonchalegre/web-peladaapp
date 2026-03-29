import {
  Paper,
  Typography,
  Box,
  Stack,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { type DragEvent, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type {
  Player,
  User,
  Transaction,
  OrganizationFinance,
} from "../../../shared/api/endpoints";
import { sortPlayersByPosition } from "../utils/playerUtils";
import {
  generateAvailablePlayersText,
  copyToClipboard,
} from "../utils/exportUtils";
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
  isAdmin?: boolean;
  totalPlayersInPelada: number;
  averagePelada: number;
  balance: number;
  peladaTransactions?: Transaction[];
  organizationFinance?: OrganizationFinance;
  onMarkPaid?: (playerId: number, amount: number) => void;
  onReversePayment?: (playerId: number) => void;
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
  isAdmin = false,
  totalPlayersInPelada,
  averagePelada,
  balance,
  peladaTransactions = [],
  organizationFinance,
  onMarkPaid,
  onReversePayment,
}: AvailablePlayersPanelProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleCopyPlayers = async () => {
    const text = generateAvailablePlayersText(players, scores);
    if (!text) return;

    const success = await copyToClipboard(text);
    if (success) {
      alert(t("common.actions.copy_success", "Copied to clipboard!"));
    }
  };

  const filteredPlayers = useMemo(() => {
    const result = search
      ? players.filter((p) =>
          p.user.name.toLowerCase().includes(search.toLowerCase()),
        )
      : [...players];

    return sortPlayersByPosition(result);
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
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={onDropToBench}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2.5 }}
        >
          <Typography variant="h6" fontWeight="800">
            {t("peladas.available.title")}
          </Typography>
          <Box
            sx={{
              bgcolor: "primary.lighter",
              color: "primary.main",
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontWeight: "bold",
              fontSize: "0.85rem",
            }}
          >
            {players.length}
          </Box>
        </Stack>

        <TextField
          fullWidth
          size="small"
          placeholder={t("peladas.available.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="disabled" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2.5 },
            },
          }}
        />

        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {filteredPlayers.map((p) => {
            const isPaid = peladaTransactions.some(
              (t: Transaction) =>
                t.player_id === p.id &&
                t.type === "income" &&
                t.category === "diarista_fee" &&
                t.status === "paid",
            );
            return (
              <AvailablePlayerItem
                key={p.id}
                player={p}
                score={scores[p.id] ?? p.grade ?? null}
                locked={locked}
                onDragStart={(e) => onDragStartPlayer(e, p.id)}
                isPaid={isPaid}
                isAdmin={isAdmin}
                onMarkPaid={
                  onMarkPaid && organizationFinance?.diarista_price
                    ? () => onMarkPaid(p.id, organizationFinance.diarista_price)
                    : undefined
                }
                onReversePayment={
                  onReversePayment ? () => onReversePayment(p.id) : undefined
                }
              />
            );
          })}
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

        {isAdmin && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GroupAddIcon />}
            onClick={() => setAddDialogOpen(true)}
            disabled={locked}
            sx={{
              textTransform: "none",
              borderRadius: 2.5,
              py: 1,
              fontWeight: "bold",
              borderWidth: 2,
              mb: 1,
              "&:hover": { borderWidth: 2 },
            }}
          >
            {t("peladas.available.button.add_players")}
          </Button>
        )}

        <Button
          fullWidth
          variant="text"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyPlayers}
          disabled={players.length === 0}
          sx={{
            textTransform: "none",
            color: "text.secondary",
            fontWeight: "bold",
          }}
        >
          {t("peladas.available.button.copy_list")}
        </Button>
      </Paper>

      {/* Stats Summary below panel */}
      <Paper
        elevation={0}
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="caption" color="text.secondary">
              Total de Jogadores
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {totalPlayersInPelada}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="caption" color="text.secondary">
              Média da Pelada
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {averagePelada.toFixed(1)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="caption" color="text.secondary">
              Saldo Previsto
            </Typography>
            <Typography
              variant="caption"
              fontWeight="bold"
              color={balance >= 0 ? "success.main" : "error.main"}
            >
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(balance)}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <AddPlayersFromOrgDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={onAddPlayersFromOrg}
        organizationId={organizationId}
        excludeUserIds={allPlayerIdsInPelada}
      />
    </Box>
  );
}
