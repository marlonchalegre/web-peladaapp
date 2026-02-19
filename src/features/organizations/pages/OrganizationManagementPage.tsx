import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  Box,
  Button,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import AddPlayersDialog from "../components/AddPlayersDialog";
import InvitePlayerDialog from "../components/InvitePlayerDialog";
import { useOrganizationManagement } from "../hooks/useOrganizationManagement";
import MembersSection from "../components/MembersSection";
import AdminsSection from "../components/AdminsSection";
import InvitationsList from "../components/InvitationsList";
import DangerZoneSection from "../components/DangerZoneSection";
import DeleteOrganizationDialog from "../components/DeleteOrganizationDialog";

export default function OrganizationManagementPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const orgId = Number(id);

  const {
    org,
    players,
    admins,
    invitations,
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
  } = useOrganizationManagement(orgId);

  if (loading) return <Loading message={t("common.loading")} />;
  if (!org)
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          {error || t("organizations.error.load_failed")}
        </Alert>
      </Container>
    );

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
        <InvitationsList
          invitations={invitations}
          onRevoke={handleRevokeInvitation}
          onInviteClick={() => setIsInviteOpen(true)}
          actionLoading={actionLoading}
        />

        <MembersSection
          players={players}
          usersMap={usersMap}
          onAddClick={() => {
            setSelectedUserIds(new Set());
            setIsAddPlayersOpen(true);
          }}
          onInviteClick={() => setIsInviteOpen(true)}
          onRemovePlayer={handleRemovePlayer}
          actionLoading={actionLoading}
        />

        <AdminsSection
          admins={admins}
          playersNotAdmins={playersNotAdmins}
          selectedAdminUserId={selectedAdminUserId}
          onAdminUserChange={setSelectedAdminUserId}
          onAddAdmin={handleAddAdmin}
          onRemoveAdmin={handleRemoveAdmin}
          actionLoading={actionLoading}
        />

        <DangerZoneSection
          orgName={org.name}
          onDeleteClick={() => setIsDeleteDialogOpen(true)}
          actionLoading={actionLoading}
        />
      </Stack>

      <DeleteOrganizationDialog
        open={isDeleteDialogOpen}
        orgName={org.name}
        confirmName={confirmOrgName}
        onConfirmNameChange={setConfirmOrgName}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setConfirmOrgName("");
        }}
        onDelete={handleDeleteOrganization}
        actionLoading={actionLoading}
      />

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
        onAddSelected={() => handleAddPlayers()}
        onAddAll={() => handleAddPlayers(usersNotPlayers.map((u) => u.id))}
        onClose={() => setIsAddPlayersOpen(false)}
      />

      <InvitePlayerDialog
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInvitePlayer}
        invitedUser={invitedUser}
        onClearInvited={() => setInvitedUser(null)}
        publicInviteLink={publicInviteLink}
        onFetchPublicLink={fetchInviteLink}
        loading={actionLoading}
      />
    </Container>
  );
}
