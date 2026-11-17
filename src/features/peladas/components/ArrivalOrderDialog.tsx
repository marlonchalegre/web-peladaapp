import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";
import type { PlayerWithUser } from "./TeamsSection";
import {
  comparePlayersByArrival,
  formatPlayerPosition,
} from "../utils/playerUtils";

export interface ArrivalOrderDialogProps {
  open: boolean;
  onClose: () => void;
  players: PlayerWithUser[];
  numTeams: number;
  playersPerTeam: number;
  processing?: boolean;
  onSaveOrder: (
    orderedPlayerIds: string[],
    runDrawAfter?: boolean,
  ) => Promise<void> | void;
}

export default function ArrivalOrderDialog({
  open,
  onClose,
  players,
  numTeams,
  playersPerTeam,
  processing = false,
  onSaveOrder,
}: ArrivalOrderDialogProps) {
  const { t } = useTranslation();
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [checkedInIds, setCheckedInIds] = useState<string[]>([]);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    if (open && !wasOpen) {
      setOrderedIds(
        [...players].sort(comparePlayersByArrival).map((p) => p.id),
      );
      const alreadyOrdered = players
        .filter((p) => p.arrival_order != null)
        .sort(comparePlayersByArrival)
        .map((p) => p.id);
      setCheckedInIds(alreadyOrdered);
    }
  }, [open, players]);

  const checkedInSet = useMemo(() => new Set(checkedInIds), [checkedInIds]);

  const playerMap = useMemo(() => {
    const map = new Map<string, PlayerWithUser>();
    players.forEach((p) => map.set(p.id, p));
    return map;
  }, [players]);

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= orderedIds.length) return;
    const next = [...orderedIds];
    [next[index], next[target]] = [next[target], next[index]];
    setOrderedIds(next);
  };

  const handleCheckInTap = (playerId: string) => {
    if (checkedInSet.has(playerId)) return;
    const nextChecked = [...checkedInIds, playerId];
    const nextSet = new Set(nextChecked);
    const remaining = orderedIds.filter((id) => !nextSet.has(id));
    setCheckedInIds(nextChecked);
    setOrderedIds([...nextChecked, ...remaining]);
  };

  const getSlotPreview = (idx: number) => {
    const capacity = numTeams * playersPerTeam;
    if (idx < capacity && playersPerTeam > 0) {
      const teamNum = Math.floor(idx / playersPerTeam) + 1;
      return {
        label: t("peladas.teams.team_number", "Time {{num}}", { num: teamNum }),
        isBench: false,
      };
    }
    return {
      label: t("peladas.teams.bench_next", "Próximo / Banco"),
      isBench: true,
    };
  };

  return (
    <Dialog
      open={open}
      onClose={processing ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      data-testid="arrival-order-dialog"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {t("peladas.teams.arrival_order_title", "Check-in & Ordem de Chegada")}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t(
            "peladas.teams.arrival_order_desc",
            "Toque em 'Chegou' conforme os jogadores chegam na quadra ou use as setas para ajustar a fila.",
          )}
        </Typography>

        <Stack spacing={1}>
          {orderedIds.map((pid, idx) => {
            const p = playerMap.get(pid);
            if (!p) return null;
            const slot = getSlotPreview(idx);
            const isChecked = checkedInSet.has(pid);
            const posLabel = formatPlayerPosition(p);

            return (
              <Box
                key={pid}
                data-testid={`arrival-row-${pid}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor: isChecked ? "primary.main" : "divider",
                  bgcolor: isChecked ? "action.selected" : "background.paper",
                }}
              >
                <Typography
                  sx={{
                    width: 28,
                    fontWeight: 800,
                    fontSize: "12px",
                    color: "text.secondary",
                    textAlign: "center",
                  }}
                >
                  {idx + 1}º
                </Typography>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                    {p.user?.name || "-"}
                  </Typography>
                  {posLabel && (
                    <Typography variant="caption" color="text.secondary">
                      {posLabel}
                    </Typography>
                  )}
                </Box>

                <Chip
                  size="small"
                  label={slot.label}
                  color={slot.isBench ? "default" : "primary"}
                  variant={slot.isBench ? "outlined" : "filled"}
                  sx={{ fontWeight: 700, fontSize: "11px" }}
                />

                {!isChecked && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CheckIcon sx={{ fontSize: 15 }} />}
                    onClick={() => handleCheckInTap(pid)}
                    data-testid={`checkin-btn-${pid}`}
                    sx={{ fontSize: "11px", py: 0.25, px: 1, minWidth: 0 }}
                  >
                    {t("peladas.teams.arrived", "Chegou")}
                  </Button>
                )}

                <IconButton
                  size="small"
                  disabled={idx === 0}
                  onClick={() => moveItem(idx, -1)}
                  aria-label="move up"
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={idx === orderedIds.length - 1}
                  onClick={() => moveItem(idx, 1)}
                  aria-label="move down"
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={processing}>
          {t("common.cancel", "Cancelar")}
        </Button>
        <Button
          variant="outlined"
          disabled={processing || orderedIds.length === 0}
          onClick={() => onSaveOrder(orderedIds, false)}
          data-testid="save-arrival-order-button"
        >
          {t("peladas.teams.save_order", "Salvar Ordem")}
        </Button>
        <Button
          variant="contained"
          disabled={processing || orderedIds.length === 0}
          onClick={() => onSaveOrder(orderedIds, true)}
          data-testid="save-and-draw-arrival-button"
        >
          {t("peladas.teams.save_and_draw", "Salvar e Sortear")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
