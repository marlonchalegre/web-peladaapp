import { useParams, useSearchParams } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  Box,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import MailIcon from "@mui/icons-material/Mail";
import StarIcon from "@mui/icons-material/Star";
import SettingsIcon from "@mui/icons-material/Settings";
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
import PlayerRatingsContent from "../components/PlayerRatingsContent";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";

interface TabPanelProps {
  children?: React.ReactNode;
  index: string;
  value: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`org-mgmt-tabpanel-${index}`}
      aria-labelledby={`org-mgmt-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function OrganizationManagementPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const orgId = Number(id);

  const activeTab = searchParams.get("tab") || "members";

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSearchParams({ tab: newValue });
  };

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
    playersNotAdmins,
    handleRemovePlayer,
    handleRevokeInvitation,
    handleAddAdmin,
    handleRemoveAdmin,
    handleAddPlayers,
    handleInvitePlayer,
    handleDeleteOrganization,
    refreshPlayers,
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
      <BreadcrumbNav
        items={[
          { label: org.name, path: `/organizations/${orgId}` },
          { label: t("organizations.detail.button.management") },
        ]}
      />

      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        {t("organizations.management.title", { name: org.name })}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="organization management tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          <Tab
            icon={<PeopleIcon />}
            iconPosition="start"
            label={t("organizations.management.sections.members")}
            value="members"
            data-testid="mgmt-tab-members"
          />
          <Tab
            icon={<StarIcon />}
            iconPosition="start"
            label={t("organizations.detail.button.ratings")}
            value="ratings"
            data-testid="mgmt-tab-ratings"
          />
          <Tab
            icon={<AdminPanelSettingsIcon />}
            iconPosition="start"
            label={t("organizations.management.sections.admins")}
            value="admins"
            data-testid="mgmt-tab-admins"
          />
          <Tab
            icon={<MailIcon />}
            iconPosition="start"
            label={t("organizations.management.sections.invitations")}
            value="invitations"
            data-testid="mgmt-tab-invitations"
          />
          <Tab
            icon={<SettingsIcon />}
            iconPosition="start"
            label={t("common.actions.manage")}
            value="settings"
            data-testid="mgmt-tab-settings"
          />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 2 }}>
        <TabPanel value={activeTab} index="members">
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
        </TabPanel>

        <TabPanel value={activeTab} index="ratings">
          <PlayerRatingsContent
            orgId={orgId}
            initialPlayers={players}
            orgName={org.name}
            onUpdateSuccess={refreshPlayers}
          />
        </TabPanel>

        <TabPanel value={activeTab} index="admins">
          <AdminsSection
            admins={admins}
            playersNotAdmins={playersNotAdmins}
            selectedAdminUserId={selectedAdminUserId}
            onAdminUserChange={setSelectedAdminUserId}
            onAddAdmin={handleAddAdmin}
            onRemoveAdmin={handleRemoveAdmin}
            actionLoading={actionLoading}
          />
        </TabPanel>

        <TabPanel value={activeTab} index="invitations">
          <InvitationsList
            invitations={invitations}
            onRevoke={handleRevokeInvitation}
            onInviteClick={() => setIsInviteOpen(true)}
            actionLoading={actionLoading}
          />
        </TabPanel>

        <TabPanel value={activeTab} index="settings">
          <DangerZoneSection
            orgName={org.name}
            onDeleteClick={() => setIsDeleteDialogOpen(true)}
            actionLoading={actionLoading}
          />
        </TabPanel>
      </Box>

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
        selectedIds={selectedUserIds}
        onSelectAll={(ids) => setSelectedUserIds(new Set(ids))}
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
        onClose={() => setIsAddPlayersOpen(false)}
        excludeUserIds={new Set(players.map((p) => p.user_id))}
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
