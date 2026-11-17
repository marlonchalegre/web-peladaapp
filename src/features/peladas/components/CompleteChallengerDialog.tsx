import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Checkbox,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import { createApi } from "../../../shared/api/endpoints";
import type { ChallengerCompletionContext } from "../../../shared/api/types";

const endpoints = createApi(api);

interface CompleteChallengerDialogProps {
  open: boolean;
  matchId: string | null;
  teamName: string;
  playerNameById: Record<string, string>;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

/**
 * Interactive dialog allowing admins to pick or randomly draw which players
 * from the leaving team stay to complete a short-handed challenger team in
 * `winner_stays_on`, prioritizing players with fewer consecutive games.
 */
export function CompleteChallengerDialog({
  open,
  matchId,
  teamName,
  playerNameById,
  onClose,
  onSaved,
}: CompleteChallengerDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<ChallengerCompletionContext | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !matchId) {
      setContext(null);
      setSelectedIds([]);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    endpoints
      .getChallengerCandidates(matchId)
      .then((res) => {
        if (!active) return;
        setContext(res);
        setSelectedIds(res.selected_player_ids || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Erro ao carregar candidatos",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, matchId]);

  const needed = context?.needed ?? 0;
  const isUnchanged = useMemo(() => {
    const initial = context?.selected_player_ids || [];
    if (initial.length !== selectedIds.length) return false;
    const initialSet = new Set(initial);
    return selectedIds.every((id) => initialSet.has(id));
  }, [context?.selected_player_ids, selectedIds]);

  const handleToggle = (playerId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }
      if (prev.length >= needed) {
        return prev;
      }
      return [...prev, playerId];
    });
  };

  const handleRandomDraw = () => {
    if (!context || needed <= 0) return;
    const eligible = context.candidates
      .filter((c) => c.eligible_by_fairness)
      .map((c) => c.player_id);
    const pool =
      eligible.length >= needed
        ? [...eligible]
        : context.candidates.map((c) => c.player_id);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setSelectedIds(pool.slice(0, needed));
  };

  const handleSave = async () => {
    if (!matchId || selectedIds.length !== needed) return;
    setSaving(true);
    setError(null);
    try {
      await endpoints.updateChallengerLineup(matchId, {
        player_ids: selectedIds,
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(
              "peladas.matches.challenger.save_error",
              "Erro ao salvar escalação",
            ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {t("peladas.matches.challenger.title", "Completar Time Desafiante")}
        {teamName ? ` — ${teamName}` : ""}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info">
            {t(
              "peladas.matches.challenger.fairness_rule",
              "Regra de rodízio justo: jogadores com menos jogos seguidos têm prioridade para evitar que o mesmo jogador jogue todas.",
            )}
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <CircularProgress size={28} sx={{ alignSelf: "center", my: 3 }} />
          ) : context && needed === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t(
                "peladas.matches.challenger.no_spots_needed",
                "O banco de reservas já preenche todas as vagas do time desafiante.",
              )}
            </Typography>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {t("peladas.matches.challenger.select_count", {
                    selected: selectedIds.length,
                    needed,
                    defaultValue: "Selecionados: {{selected}} de {{needed}}",
                  })}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CasinoIcon />}
                  onClick={handleRandomDraw}
                  disabled={!context || needed === 0 || saving}
                  data-testid="challenger-random-draw-button"
                >
                  {t(
                    "peladas.matches.challenger.draw_eligible",
                    "Sortear Elegíveis",
                  )}
                </Button>
              </Box>

              <Stack spacing={1}>
                {(context?.candidates || []).map((candidate) => {
                  const checked = selectedIds.includes(candidate.player_id);
                  const disabled =
                    saving || (!checked && selectedIds.length >= needed);
                  return (
                    <Box
                      key={candidate.player_id}
                      onClick={() => {
                        if (!disabled) handleToggle(candidate.player_id);
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.25,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: checked ? "primary.main" : "divider",
                        bgcolor: checked
                          ? "action.selected"
                          : "background.paper",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity:
                          !candidate.eligible_by_fairness && !checked
                            ? 0.72
                            : 1,
                      }}
                      data-testid={`challenger-candidate-${candidate.player_id}`}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          size="small"
                          sx={{ p: 0.5 }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {playerNameById[candidate.player_id] ||
                              candidate.player_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t("peladas.matches.challenger.consecutive_games", {
                              count: candidate.consecutive_games,
                              defaultValue:
                                candidate.consecutive_games === 1
                                  ? "{{count}} jogo seguido"
                                  : "{{count}} jogos seguidos",
                            })}{" "}
                            ·{" "}
                            {t("peladas.matches.challenger.total_games", {
                              count: candidate.total_games,
                              defaultValue:
                                candidate.total_games === 1
                                  ? "{{count}} jogo"
                                  : "{{count}} jogos",
                            })}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip
                        size="small"
                        label={
                          candidate.eligible_by_fairness
                            ? t(
                                "peladas.matches.challenger.eligible",
                                "Prioridade",
                              )
                            : t(
                                "peladas.matches.challenger.over_limit",
                                "Mais seguidos",
                              )
                        }
                        color={
                          candidate.eligible_by_fairness ? "success" : "default"
                        }
                        variant={
                          candidate.eligible_by_fairness ? "filled" : "outlined"
                        }
                      />
                    </Box>
                  );
                })}
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t("common.cancel", "Cancelar")}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={
            loading ||
            saving ||
            needed === 0 ||
            selectedIds.length !== needed ||
            isUnchanged
          }
          data-testid="challenger-save-button"
        >
          {t("peladas.matches.challenger.confirm", "Confirmar Escalação")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
