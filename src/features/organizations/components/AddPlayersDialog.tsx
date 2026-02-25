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
  Stack,
  TextField,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { useState, useEffect, useCallback, useRef } from "react";
import { createApi, type User } from "../../../shared/api/endpoints";
import { api } from "../../../shared/api/client";
import { useTranslation } from "react-i18next";

const endpoints = createApi(api);

type Props = {
  open: boolean;
  selectedIds: Set<number>;
  onSelectAll: (ids: number[]) => void;
  onClear: () => void;
  onToggle: (userId: number, checked: boolean) => void;
  onAddSelected: () => Promise<void>;
  onClose: () => void;
  excludeUserIds?: Set<number>;
};

export default function AddPlayersDialog({
  open,
  selectedIds,
  onSelectAll,
  onClear,
  onToggle,
  onAddSelected,
  onClose,
  excludeUserIds = new Set(),
}: Props) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUsers = useCallback(
    async (query: string, pageNum: number, append: boolean = false) => {
      setLoading(true);
      try {
        const response = await endpoints.searchUsers(query, pageNum, 10);
        const filteredData = response.data.filter(
          (u) => !excludeUserIds.has(u.id),
        );
        if (append) {
          setUsers((prev) => [...prev, ...filteredData]);
        } else {
          setUsers(filteredData);
        }
        setHasMore(pageNum < response.totalPages);
      } catch (error) {
        console.error("Failed to search users", error);
      } finally {
        setLoading(false);
      }
    },
    [excludeUserIds],
  );

  useEffect(() => {
    if (open) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setPage(1);
        fetchUsers(searchQuery, 1);
      }, 300);
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, open, fetchUsers]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(searchQuery, nextPage, true);
  };

  const handleSelectAllFound = () => {
    const allIds = users.map((u) => u.id);
    onSelectAll(allIds);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("organizations.dialog.add_players.title")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder={
              t("common.fields.name") + " / " + t("common.fields.email")
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={handleSelectAllFound}
              disabled={users.length === 0}
            >
              {t("organizations.dialog.add_players.select_all")}
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={onClear}
              disabled={selectedIds.size === 0}
            >
              {t("organizations.dialog.add_players.clear_selection")}
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {t("common.selected", { count: selectedIds.size })}
            </Typography>
          </Stack>

          <List sx={{ maxHeight: 320, minHeight: 100, overflow: "auto" }}>
            {users.length === 0 && !loading && (
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography color="text.secondary">
                  {searchQuery
                    ? t("organizations.dialog.add_players.no_results")
                    : t("organizations.dialog.add_players.empty_users")}
                </Typography>
              </Box>
            )}
            {users.map((u) => (
              <ListItem
                key={`user-${u.id}`}
                secondaryAction={
                  <Checkbox
                    edge="end"
                    checked={selectedIds.has(u.id)}
                    onChange={(e) => onToggle(u.id, e.target.checked)}
                  />
                }
              >
                <ListItemText primary={u.name} secondary={u.email} />
              </ListItem>
            ))}
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {hasMore && !loading && (
              <Button fullWidth onClick={handleLoadMore}>
                {t("common.load_more")}
              </Button>
            )}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          onClick={onAddSelected}
          variant="contained"
          disabled={selectedIds.size === 0}
        >
          {t("organizations.dialog.add_players.add_selected", {
            count: selectedIds.size,
          })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
