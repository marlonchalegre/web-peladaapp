import { useEffect, useState, useCallback } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  Paper,
  Box,
  Button,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AddIcon from "@mui/icons-material/Add";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Organization,
  type User,
  type Player,
  type OrganizationAdmin,
} from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import AddPlayersDialog from "../components/AddPlayersDialog";

const endpoints = createApi(api);

export default function OrganizationManagementPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const orgId = Number(id);

  const [org, setOrg] = useState<Organization | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [admins, setAdmins] = useState<OrganizationAdmin[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddPlayersOpen, setIsAddPlayersOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<number | "">(
    "",
  );
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Org Confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmOrgName, setConfirmOrgName] = useState("");

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const [o, p, a, u] = await Promise.all([
        endpoints.getOrganization(orgId),
        endpoints.listPlayersByOrg(orgId),
        endpoints.listAdminsByOrganization(orgId),
        endpoints.listUsers(),
      ]);
      setOrg(o);
      setPlayers(p);
      setAdmins(a);
      setAllUsers(u);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("organizations.error.load_failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orgId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemovePlayer = async (playerId: number) => {
    if (!window.confirm(t("organizations.management.remove_member_confirm")))
      return;

    setActionLoading(true);
    try {
      await endpoints.deletePlayer(playerId);
      await fetchData();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("organizations.error.delete_failed");
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (selectedAdminUserId === "") return;

    setActionLoading(true);
    try {
      await endpoints.addOrganizationAdmin(
        orgId,
        selectedAdminUserId as number,
      );
      setSelectedAdminUserId("");
      await fetchData();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("organizations.error.add_admin_failed");
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId: number) => {
    if (admins.length === 1) {
      setError(t("organizations.error.remove_last_admin"));
      return;
    }

    setActionLoading(true);
    try {
      await endpoints.removeOrganizationAdmin(orgId, userId);
      await fetchData();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("organizations.error.remove_admin_failed");
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPlayers = async () => {
    setActionLoading(true);
    try {
      const ids = Array.from(selectedUserIds);
      await Promise.all(
        ids.map((uid) =>
          endpoints.createPlayer({ organization_id: orgId, user_id: uid }),
        ),
      );
      setIsAddPlayersOpen(false);
      setSelectedUserIds(new Set());
      await fetchData();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("organizations.error.add_players_failed", {
              defaultValue: "Error adding players",
            });
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loading message={t("common.loading")} />;
  if (!org)
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          {error || t("organizations.error.load_failed")}
        </Alert>
      </Container>
    );

  const usersMap = new Map(allUsers.map((u) => [u.id, u]));
  const playerUserIds = new Set(players.map((p) => p.user_id));
  const usersNotPlayers = allUsers.filter((u) => !playerUserIds.has(u.id));

  const adminUserIds = new Set(admins.map((a) => a.user_id));
  const playersNotAdmins = players
    .map((p) => usersMap.get(p.user_id))
    .filter((u): u is User => u !== undefined && !adminUserIds.has(u.id));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Button
          component={RouterLink}
          to={`/organizations/${orgId}`}
          startIcon={<ArrowBackIcon />}
          variant="text"
        >
          {t("common.back_to_org")}
        </Button>
      </Box>

      <Typography variant="h4" gutterBottom fontWeight="bold">
        {t("organizations.management.title", { name: org.name })}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={4}>
        {/* Members Section */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5">
              {t("organizations.management.sections.members")}
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => {
                setSelectedUserIds(new Set());
                setIsAddPlayersOpen(true);
              }}
              disabled={actionLoading}
            >
              {t("common.add")}
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {players.length === 0 ? (
              <Typography color="text.secondary">
                {t("organizations.list.empty")}
              </Typography>
            ) : (
              players.map((player) => {
                const user = usersMap.get(player.user_id);
                return (
                  <ListItem key={player.id}>
                    <ListItemText
                      primary={user?.name || `User #${player.user_id}`}
                      secondary={user?.email}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleRemovePlayer(player.id)}
                        disabled={actionLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })
            )}
          </List>
        </Paper>

        {/* Admins Section */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t("organizations.management.sections.admins")}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t("organizations.dialog.manage_admins.add_section_title")}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                select
                fullWidth
                size="small"
                value={selectedAdminUserId}
                onChange={(e) =>
                  setSelectedAdminUserId(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                disabled={actionLoading || playersNotAdmins.length === 0}
                label={
                  playersNotAdmins.length === 0
                    ? t(
                        "organizations.dialog.manage_admins.all_users_are_admins",
                      )
                    : t("organizations.dialog.manage_admins.select_user_label")
                }
              >
                <MenuItem value="">{t("common.select_placeholder")}</MenuItem>
                {playersNotAdmins.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                onClick={handleAddAdmin}
                disabled={actionLoading || selectedAdminUserId === ""}
                startIcon={
                  actionLoading ? <CircularProgress size={20} /> : <AddIcon />
                }
              >
                {t("common.add")}
              </Button>
            </Box>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            {t("organizations.dialog.manage_admins.current_admins_title")}
          </Typography>
          <List>
            {admins.map((admin) => (
              <ListItem key={admin.id}>
                <ListItemText
                  primary={
                    admin.user_name ||
                    t("organizations.dialog.manage_admins.user_fallback", {
                      id: admin.user_id,
                    })
                  }
                  secondary={admin.user_email}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveAdmin(admin.user_id)}
                    disabled={actionLoading || admins.length === 1}
                    title={
                      admins.length === 1
                        ? t(
                            "organizations.dialog.manage_admins.cannot_remove_last_admin_tooltip",
                          )
                        : t(
                            "organizations.dialog.manage_admins.remove_admin_tooltip",
                          )
                    }
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Danger Zone Section */}
        <Paper variant="outlined" sx={{ p: 3, borderColor: "error.main" }}>
          <Typography variant="h5" color="error" gutterBottom>
            {t("organizations.management.sections.danger_zone")}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t("organizations.management.delete_description")}
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={actionLoading}
          >
            {t("organizations.table.aria.delete", { name: org.name })}
          </Button>
        </Paper>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setConfirmOrgName("");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main", fontWeight: "bold" }}>
          {t("organizations.management.delete_confirm_title")}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t("organizations.management.delete_confirm_instruction", {
              name: org.name,
            })}
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={confirmOrgName}
            onChange={(e) => setConfirmOrgName(e.target.value)}
            placeholder={org.name}
            autoComplete="off"
            onPaste={(e) => e.preventDefault()}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsDeleteDialogOpen(false);
              setConfirmOrgName("");
            }}
            disabled={actionLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={confirmOrgName !== org.name || actionLoading}
            onClick={async () => {
              try {
                setActionLoading(true);
                await endpoints.deleteOrganization(orgId);
                navigate("/");
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
                setActionLoading(false);
                setIsDeleteDialogOpen(false);
                setConfirmOrgName("");
              }
            }}
          >
            {actionLoading ? (
              <CircularProgress size={24} />
            ) : (
              t("common.delete")
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <AddPlayersDialog
        open={isAddPlayersOpen}
        users={usersNotPlayers}
        selectedIds={selectedUserIds}
        onSelectAll={() =>
          setSelectedUserIds(new Set(usersNotPlayers.map((u) => u.id)))
        }
        onClear={() => setSelectedUserIds(new Set())}
        onToggle={(id, checked) =>
          setSelectedUserIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
          })
        }
        onAddSelected={handleAddPlayers}
        onAddAll={async () => {
          setSelectedUserIds(new Set(usersNotPlayers.map((u) => u.id)));
          // The state update might not be immediate for handleAddPlayers if called right after
          // so we use a temp set
          const allIds = usersNotPlayers.map((u) => u.id);
          setActionLoading(true);
          try {
            await Promise.all(
              allIds.map((uid) =>
                endpoints.createPlayer({
                  organization_id: orgId,
                  user_id: uid,
                }),
              ),
            );
            setIsAddPlayersOpen(false);
            await fetchData();
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          } finally {
            setActionLoading(false);
          }
        }}
        onClose={() => setIsAddPlayersOpen(false)}
      />
    </Container>
  );
}
