import { useState, useMemo } from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import {
  type Player,
  type MonthlyWaitlistEntry,
} from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";

interface MonthlyWaitlistSectionProps {
  waitlist: MonthlyWaitlistEntry[];
  players: Player[];
  onAddCandidate: (playerId: string) => Promise<void>;
  onRemoveCandidate: (playerId: string) => Promise<void>;
  onPromoteCandidate: (playerId: string) => Promise<void>;
  actionLoading: boolean;
}

export default function MonthlyWaitlistSection({
  waitlist,
  players,
  onAddCandidate,
  onRemoveCandidate,
  onPromoteCandidate,
  actionLoading,
}: MonthlyWaitlistSectionProps) {
  const { t } = useTranslation();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [playerToPromote, setPlayerToPromote] =
    useState<MonthlyWaitlistEntry | null>(null);
  const [playerToRemove, setPlayerToRemove] =
    useState<MonthlyWaitlistEntry | null>(null);

  const eligiblePlayers = useMemo(() => {
    if (!isAddDialogOpen) return [];
    const waitlistPlayerIds = new Set(waitlist.map((w) => w.player_id));
    return players.filter(
      (p) =>
        p.member_type !== "mensalista" &&
        p.member_type !== "mensalista_temporario" &&
        !waitlistPlayerIds.has(p.id),
    );
  }, [players, waitlist, isAddDialogOpen]);

  const handleOpenAddDialog = () => {
    setSelectedPlayerId("");
    setIsAddDialogOpen(true);
  };

  const handleConfirmAdd = async () => {
    if (!selectedPlayerId) return;
    try {
      await onAddCandidate(selectedPlayerId);
      setIsAddDialogOpen(false);
      setSelectedPlayerId("");
    } catch {
      // Error handled by parent hook
    }
  };

  const handleConfirmPromote = async () => {
    if (!playerToPromote) return;
    try {
      await onPromoteCandidate(playerToPromote.player_id);
      setPlayerToPromote(null);
    } catch {
      // Error handled by parent hook
    }
  };

  const handleConfirmRemove = async () => {
    if (!playerToRemove) return;
    try {
      await onRemoveCandidate(playerToRemove.player_id);
      setPlayerToRemove(null);
    } catch {
      // Error handled by parent hook
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormatListNumberedIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            {t("organizations.management.waitlist.title")}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenAddDialog}
          disabled={actionLoading}
          data-testid="waitlist-add-button"
          size="small"
        >
          {t("organizations.management.waitlist.add_button")}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("organizations.management.waitlist.subtitle")}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {waitlist.length === 0 ? (
        <Typography
          sx={{
            color: "text.secondary",
            py: 4,
            textAlign: "center",
          }}
          data-testid="waitlist-empty-message"
        >
          {t("organizations.management.waitlist.empty")}
        </Typography>
      ) : (
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell width={60} align="center">
                  #
                </TableCell>
                <TableCell>
                  {t("common.fields.player_name", "Jogador")}
                </TableCell>
                <TableCell>{t("common.fields.position", "Posição")}</TableCell>
                <TableCell>{t("common.fields.member_type", "Tipo")}</TableCell>
                <TableCell>
                  {t("common.fields.joined_at", "Entrada na Fila")}
                </TableCell>
                <TableCell align="right">
                  {t("common.actions.title", "Ações")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {waitlist.map((entry, index) => {
                const positionKey = entry.position
                  ? `common.positions.${entry.position.toLowerCase()}`
                  : "common.positions.unknown";
                const memberTypeKey = entry.member_type
                  ? `common.member_types.${entry.member_type}`
                  : "common.member_types.convidado";

                return (
                  <TableRow key={entry.id} data-testid="waitlist-row">
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", color: "text.secondary" }}
                      >
                        {index + 1}º
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <SecureAvatar
                          userId={entry.user_id}
                          filename={entry.user_avatar_filename}
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: "primary.dark",
                          }}
                          fallbackText={(
                            entry.user_name?.charAt(0) || ""
                          ).toUpperCase()}
                        />
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: "medium" }}
                          >
                            {entry.user_name || `User #${entry.user_id}`}
                          </Typography>
                          {entry.user_username && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              @{entry.user_username}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{t(positionKey)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(memberTypeKey, {
                          defaultValue: entry.member_type || "",
                        })}
                        size="small"
                        variant="outlined"
                        color={
                          entry.member_type === "diarista"
                            ? "primary"
                            : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {entry.created_at
                          ? dayjs(entry.created_at).format("DD/MM/YYYY HH:mm")
                          : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <Tooltip
                          title={t(
                            "organizations.management.waitlist.promote_button",
                          )}
                        >
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<HowToRegIcon />}
                            disabled={actionLoading}
                            onClick={() => setPlayerToPromote(entry)}
                            data-testid={`promote-waitlist-btn-${entry.player_id}`}
                            sx={{ textTransform: "none" }}
                          >
                            {t(
                              "organizations.management.waitlist.promote_button",
                            )}
                          </Button>
                        </Tooltip>
                        <Tooltip
                          title={t(
                            "organizations.management.waitlist.remove_button",
                          )}
                        >
                          <IconButton
                            color="error"
                            size="small"
                            disabled={actionLoading}
                            onClick={() => setPlayerToRemove(entry)}
                            data-testid={`remove-waitlist-btn-${entry.player_id}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {t("organizations.management.waitlist.candidate_dialog.title")}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {eligiblePlayers.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              {t(
                "organizations.management.waitlist.candidate_dialog.no_eligible",
              )}
            </Typography>
          ) : (
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="select-candidate-label">
                {t(
                  "organizations.management.waitlist.candidate_dialog.select_player",
                )}
              </InputLabel>
              <Select
                labelId="select-candidate-label"
                value={selectedPlayerId}
                label={t(
                  "organizations.management.waitlist.candidate_dialog.select_player",
                )}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                data-testid="waitlist-candidate-select"
              >
                {eligiblePlayers.map((player) => (
                  <MenuItem key={player.id} value={player.id}>
                    {player.user_name || `User #${player.user_id}`} (
                    {player.member_type || "convidado"})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsAddDialogOpen(false)}
            color="inherit"
            disabled={actionLoading}
          >
            {t("organizations.management.waitlist.candidate_dialog.cancel")}
          </Button>
          <Button
            onClick={handleConfirmAdd}
            variant="contained"
            disabled={
              actionLoading || !selectedPlayerId || eligiblePlayers.length === 0
            }
            data-testid="confirm-add-candidate-btn"
          >
            {t("organizations.management.waitlist.candidate_dialog.submit")}
          </Button>
        </DialogActions>
      </Dialog>

      <PrettyConfirmDialog
        open={Boolean(playerToPromote)}
        title={t("organizations.management.waitlist.promote_confirm_title")}
        description={t(
          "organizations.management.waitlist.promote_confirm_message",
          { name: playerToPromote?.user_name || "" },
        )}
        confirmLabel={t("organizations.management.waitlist.promote_button")}
        severity="primary"
        onConfirm={handleConfirmPromote}
        onClose={() => setPlayerToPromote(null)}
      />

      <PrettyConfirmDialog
        open={Boolean(playerToRemove)}
        title={t("organizations.management.waitlist.remove_confirm_title")}
        description={t(
          "organizations.management.waitlist.remove_confirm_message",
          { name: playerToRemove?.user_name || "" },
        )}
        confirmLabel={t("organizations.management.waitlist.remove_button")}
        severity="error"
        onConfirm={handleConfirmRemove}
        onClose={() => setPlayerToRemove(null)}
      />
    </Paper>
  );
}
