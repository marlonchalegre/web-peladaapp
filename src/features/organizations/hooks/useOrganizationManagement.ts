import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import { createApi, type Organization, type User, type Player, type OrganizationAdmin, type OrganizationInvitation } from "../../../shared/api/endpoints";

const endpoints = createApi(api);

export function useOrganizationManagement(orgId: number) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [org, setOrg] = useState<Organization | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [admins, setAdmins] = useState<OrganizationAdmin[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddPlayersOpen, setIsAddPlayersOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [publicInviteLink, setPublicInviteLink] = useState<string | null>(null);
  const [invitedUser, setInvitedUser] = useState<{
    email: string;
    isNew: boolean;
  } | null>(null);
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
      const [o, p, a, i, u] = await Promise.all([
        endpoints.getOrganization(orgId),
        endpoints.listPlayersByOrg(orgId),
        endpoints.listAdminsByOrganization(orgId),
        endpoints.listOrganizationInvitations(orgId),
        endpoints.listUsers(),
      ]);
      setOrg(o);
      setPlayers(p);
      setAdmins(a);
      setInvitations(i);
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

  const handleRevokeInvitation = async (invitationId: number) => {
    if (!window.confirm(t("organizations.management.revoke_invitation_confirm", "Are you sure you want to revoke this invitation?")))
      return;

    setActionLoading(true);
    try {
      await endpoints.revokeInvitation(orgId, invitationId);
      await fetchData();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("organizations.error.revoke_failed", "Failed to revoke invitation");
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

  const handleAddPlayers = async (ids?: number[]) => {
    const playerIds = ids || Array.from(selectedUserIds);
    setActionLoading(true);
    try {
      await Promise.all(
        playerIds.map((uid) =>
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

  const fetchInviteLink = useCallback(async () => {
    setActionLoading(true);
    try {
      const { token } = await endpoints.getInviteLink(orgId);
      setPublicInviteLink(`${window.location.origin}/join/${token}`);
    } catch (err) {
      console.error("Failed to fetch invite link", err);
    } finally {
      setActionLoading(false);
    }
  }, [orgId]);

  const handleInvitePlayer = async (email: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const result = await endpoints.invitePlayer(orgId, email);
      setInvitedUser({ email: result.email, isNew: result.is_new_user });
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!org || confirmOrgName !== org.name) return;
    setActionLoading(true);
    try {
      await endpoints.deleteOrganization(orgId);
      navigate("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setActionLoading(false);
      setIsDeleteDialogOpen(false);
      setConfirmOrgName("");
    }
  };

  const usersMap = useMemo(
    () => new Map(allUsers.map((u) => [u.id, u])),
    [allUsers],
  );
  const playerUserIds = useMemo(
    () => new Set(players.map((p) => p.user_id)),
    [players],
  );
  const usersNotPlayers = useMemo(
    () => allUsers.filter((u) => !playerUserIds.has(u.id)),
    [allUsers, playerUserIds],
  );

  const adminUserIds = useMemo(
    () => new Set(admins.map((a) => a.user_id)),
    [admins],
  );
  const playersNotAdmins = useMemo(
    () =>
      players
        .map((p) => usersMap.get(p.user_id))
        .filter((u): u is User => u !== undefined && !adminUserIds.has(u.id)),
    [players, usersMap, adminUserIds],
  );

  return {
    org,
    players,
    admins,
    invitations,
    allUsers,
    loading,
    error,
    setError,
    actionLoading,
    isAddPlayersOpen,
    setIsAddPlayersOpen,
    isInviteOpen,
    setIsInviteOpen,
    publicInviteLink,
    fetchInviteLink,
    invitedUser,
    setInvitedUser,
    selectedUserIds,
    setSelectedUserIds,
    selectedAdminUserId,
    setSelectedAdminUserId,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    confirmOrgName,
    setConfirmOrgName,
    usersMap,
    usersNotPlayers,
    playersNotAdmins,
    handleRemovePlayer,
    handleRevokeInvitation,
    handleAddAdmin,
    handleRemoveAdmin,
    handleAddPlayers,
    handleInvitePlayer,
    handleDeleteOrganization,
  };
}
