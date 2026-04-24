import {
  Paper,
  Typography,
  Box,
  Stack,
  TextField,
  InputAdornment,
  Button,
  Grid,
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
  Team,
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
  peladaTransactions?: Transaction[];
  onMarkPaid?: (playerId: number, amount: number) => void;
  onReversePayment?: (playerId: number) => void;
  teams?: Team[];
  onMoveToTeam?: (playerId: number, teamId: number) => void;
  onMoveToFixedGk?: (playerId: number, side: "home" | "away") => void;
  hasFixedGoalkeepers?: boolean;
};

import { useOrganizationFinance } from "../../../shared/hooks/useOrganizationFinance";

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
  peladaTransactions = [],
  onMarkPaid,
  onReversePayment,
  teams = [],
  onMoveToTeam,
  onMoveToFixedGk,
  hasFixedGoalkeepers = false,
}: AvailablePlayersPanelProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { organizationFinance } = useOrganizationFinance(organizationId);

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
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ mb: 2.5 }}
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
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

          <Stack direction="row" spacing={1}>
            {isAdmin && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<GroupAddIcon />}
                onClick={() => setAddDialogOpen(true)}
                disabled={locked}
                data-testid="invite-player-button"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
                {t("peladas.available.button.add_players")}
              </Button>
            )}
            <Button
              variant="text"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyPlayers}
              disabled={players.length === 0}
              data-testid="copy-players-button"
              sx={{
                textTransform: "none",
                color: "text.secondary",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              {t("peladas.available.button.copy_list")}
            </Button>
          </Stack>
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

        <Grid container spacing={2}>
          {filteredPlayers.map((p) => {
            const isPaid = peladaTransactions.some(
              (t: Transaction) =>
                t.player_id === p.id &&
                t.type === "income" &&
                t.category === "diarista_fee" &&
                t.status === "paid",
            );
            return (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <AvailablePlayerItem
                  player={p}
                  score={scores[p.id] ?? p.grade ?? null}
                  locked={locked}
                  onDragStart={(e) => onDragStartPlayer(e, p.id)}
                  isPaid={isPaid}
                  isAdmin={isAdmin}
                  onMarkPaid={
                    onMarkPaid && organizationFinance?.diarista_price
                      ? () =>
                          onMarkPaid(p.id, organizationFinance.diarista_price)
                      : undefined
                  }
                  onReversePayment={
                    onReversePayment ? () => onReversePayment(p.id) : undefined
                  }
                  teams={teams}
                  onMoveToTeam={onMoveToTeam}
                  onMoveToFixedGk={onMoveToFixedGk}
                  hasFixedGoalkeepers={hasFixedGoalkeepers}
                />
              </Grid>
            );
          })}
          {players.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography
                variant="body1"
                color="text.disabled"
                align="center"
                sx={{
                  py: 6,
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 4,
                  fontWeight: "bold",
                }}
              >
                {t("peladas.available.bench_is_empty")}
              </Typography>
            </Grid>
          )}
          {players.length > 0 && filteredPlayers.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography
                variant="body2"
                color="text.disabled"
                align="center"
                sx={{ py: 4 }}
              >
                {t("peladas.available.no_players_found")}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      <AddPlayersFromOrgDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={onAddPlayersFromOrg}
        organizationId={organizationId}
        excludePlayerIds={allPlayerIdsInPelada}
      />
    </Box>
  );
}
