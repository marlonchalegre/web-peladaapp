import { useState, useEffect, useCallback } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  TextField,
  InputAdornment,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Player,
  type User,
} from "../../../shared/api/endpoints";

const endpoints = createApi(api);

type PlayerWithUser = Player & { user: User };

type AddPlayersFromOrgDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (playerIds: number[]) => Promise<void>;
  organizationId: number;
  excludePlayerIds: number[];
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
  const [allPlayers, setAllPlayers] = useState<PlayerWithUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const players = await endpoints.listPlayersByOrg(organizationId);
      // Filter out players already in pelada
      const available = players.filter(
        (p) => !excludePlayerIds.includes(p.id),
      ) as PlayerWithUser[];
      setAllPlayers(available);
    } catch (err) {
      console.error("Failed to load organization players", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, excludePlayerIds]);

  useEffect(() => {
    if (open && organizationId) {
      loadPlayers();
    }
  }, [open, organizationId, loadPlayers]);

  const handleToggle = (id: number) => {
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
      onClose();
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to add players", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlayers = allPlayers.filter(
    (p) =>
      (p.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.user_username || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("peladas.panel.available.add_dialog.title")}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("peladas.panel.available.add_dialog.description")}
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder={t(
            "peladas.panel.available.add_dialog.search_placeholder",
          )}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <List sx={{ maxHeight: 300, overflow: "auto" }}>
            {filteredPlayers.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary={t("peladas.panel.available.add_dialog.empty")}
                  sx={{ textAlign: "center", color: "text.secondary" }}
                />
              </ListItem>
            ) : (
              filteredPlayers.map((player) => (
                <ListItem
                  key={player.id}
                  dense
                  component="div"
                  onClick={() => handleToggle(player.id)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 1,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Checkbox
                    edge="start"
                    checked={selectedIds.has(player.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemText
                    primary={player.user_name}
                    secondary={`@${player.user_username}`}
                  />
                </ListItem>
              ))
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t("common.actions.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={selectedIds.size === 0 || submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {t("peladas.panel.available.add_dialog.submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
