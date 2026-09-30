import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Checkbox,
  TextField,
  InputAdornment,
  CircularProgress,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import { createApi, type Player } from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import {
  AVATAR_BG_COLORS,
  getInitials,
  formatPosition,
  sortPlayersByPosition,
} from "../utils/playerUtils";

const endpoints = createApi(api);

type AddPlayersFromOrgDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (playerIds: string[]) => Promise<void>;
  organizationId: string;
  excludePlayerIds: string[];
};

export default function AddPlayersFromOrgDialog({
  open,
  onClose,
  onAdd,
  organizationId,
  excludePlayerIds,
}: AddPlayersFromOrgDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orgPlayers, setOrgPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearch("");
    onClose();
  };

  useEffect(() => {
    let active = true;
    if (open && organizationId) {
      setLoading(true);
      endpoints
        .listPlayersByOrg(organizationId)
        .then((players) => {
          if (active) setOrgPlayers(players);
        })
        .catch((err) => {
          if (active) console.error("Failed to load organization players", err);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [open, organizationId]);

  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      await onAdd(Array.from(selectedIds));
      handleClose();
    } catch (err) {
      console.error("Failed to add players", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    const excludeSet = new Set(excludePlayerIds);
    const query = search.trim().toLowerCase();
    const available = orgPlayers.filter((p) => !excludeSet.has(p.id));
    const sorted = sortPlayersByPosition(available);
    if (!query) return sorted;
    return sorted.filter(
      (p) =>
        (p.user_name || "").toLowerCase().includes(query) ||
        (p.user_username || "").toLowerCase().includes(query),
    );
  }, [orgPlayers, excludePlayerIds, search]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            bgcolor: "background.paper",
            borderRadius: "18px",
            border: (theme) =>
              theme.palette.mode === "dark"
                ? `1px solid ${theme.palette.divider}`
                : theme.palette.brutalist?.border ||
                  `2px solid ${theme.palette.divider}`,
            p: 0.5,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "15px",
          color: "text.primary",
          pt: 1.5,
          pb: 1,
          px: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            component="span"
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "15px",
              color: "text.primary",
            }}
          >
            {t(
              "peladas.panel.available.add_dialog.title",
              "Adicionar Jogadores da Organização",
            )}
          </Typography>
          {selectedIds.size > 0 && (
            <Chip
              label={`${selectedIds.size}`}
              size="small"
              sx={{
                height: 20,
                fontSize: "11px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                bgcolor: "primary.lighter",
                color: "primary.main",
              }}
            />
          )}
        </Box>
        <IconButton
          onClick={handleClose}
          aria-label={t("common.actions.close", "Fechar")}
          sx={{ color: "text.secondary" }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2, py: 1 }}>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 500,
            fontSize: "12px",
            color: "text.secondary",
            mb: 2,
            lineHeight: 1.4,
          }}
        >
          {t(
            "peladas.panel.available.add_dialog.description",
            "Selecione os jogadores que não confirmaram presença mas desejam participar agora.",
          )}
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder={t(
            "peladas.panel.available.add_dialog.search_placeholder",
            "Buscar por nome...",
          )}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              fontFamily: "Archivo, sans-serif",
              fontSize: "13px",
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    fontSize="small"
                    sx={{ color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
            },
          }}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              borderRadius: "14px",
              overflow: "hidden",
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {filteredPlayers.length === 0 ? (
              <Typography
                align="center"
                sx={{
                  p: 4,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "text.secondary",
                }}
              >
                {t(
                  "peladas.panel.available.add_dialog.empty",
                  "Nenhum jogador disponível para adicionar.",
                )}
              </Typography>
            ) : (
              filteredPlayers.map((player, idx) => {
                const isSelected = selectedIds.has(player.id);
                return (
                  <Box
                    key={player.id}
                    onClick={() => handleToggle(player.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.4,
                      p: "10px 14px",
                      cursor: "pointer",
                      bgcolor: isSelected ? "action.selected" : "transparent",
                      borderBottom:
                        idx === filteredPlayers.length - 1
                          ? "none"
                          : "1px solid",
                      borderColor: "divider",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <Checkbox
                      edge="start"
                      checked={isSelected}
                      tabIndex={-1}
                      disableRipple
                      size="small"
                      sx={{
                        p: 0.5,
                        color: "text.secondary",
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />
                    <SecureAvatar
                      userId={player.user_id}
                      filename={player.user_avatar_filename}
                      fallbackText={getInitials(player.user_name)}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor:
                          AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length],
                        color: "text.primary",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "10px",
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        noWrap
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "12.5px",
                          lineHeight: 1.2,
                          color: "text.primary",
                        }}
                      >
                        {player.user_name || t("common.player", "Jogador")}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.25,
                        }}
                      >
                        {player.user_username && (
                          <Typography
                            noWrap
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 500,
                              fontSize: "10.5px",
                              color: "text.secondary",
                            }}
                          >
                            @{player.user_username}
                          </Typography>
                        )}
                        <Typography
                          component="span"
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 600,
                            fontSize: "9.5px",
                            textTransform: "uppercase",
                            letterSpacing: ".04em",
                            color: "text.secondary",
                          }}
                        >
                          {formatPosition(
                            player.position || player.user_position,
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pt: 1.5, pb: 1.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          sx={{
            borderRadius: "10px",
            border: "1.5px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            py: 0.9,
            px: 2,
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "11px",
            letterSpacing: ".04em",
            color: "text.secondary",
            textTransform: "none",
            "&:hover": {
              bgcolor: "action.hover",
              borderColor: "text.primary",
            },
          }}
        >
          {t("common.actions.cancel", "Cancelar")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={selectedIds.size === 0 || submitting}
          startIcon={
            submitting ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{
            borderRadius: "10px",
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "primary.main" : "text.primary",
            py: 0.9,
            px: 2.2,
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "11px",
            letterSpacing: ".04em",
            color: (theme) =>
              theme.palette.mode === "dark"
                ? "primary.contrastText"
                : "background.paper",
            textTransform: "none",
            "&:hover": {
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "primary.light"
                  : "text.primary",
            },
            "&.Mui-disabled": {
              bgcolor: "action.disabledBackground",
              color: "text.disabled",
            },
          }}
        >
          {t(
            "peladas.panel.available.add_dialog.submit",
            "Adicionar Selecionados",
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
