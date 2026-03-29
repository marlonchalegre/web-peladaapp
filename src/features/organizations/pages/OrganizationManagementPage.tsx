import { useParams, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
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
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthContext";
import { Loading } from "../../../shared/components/Loading";
import AddPlayersDialog from "../components/AddPlayersDialog";
import InvitePlayerDialog from "../components/InvitePlayerDialog";
import { useOrganizationManagement } from "../hooks/useOrganizationManagement";
import MembersSection from "../components/MembersSection";
import FinanceSection from "../components/FinanceSection";
import AdminsSection from "../components/AdminsSection";
import InvitationsList from "../components/InvitationsList";
import DangerZoneSection from "../components/DangerZoneSection";
import WahaConfigSection from "../components/WahaConfigSection";
import DeleteOrganizationDialog from "../components/DeleteOrganizationDialog";
import PlayerRatingsContent from "../components/PlayerRatingsContent";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";

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
      {value === index && <Box sx={{ pt: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

export default function OrganizationManagementPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const orgId = Number(id);

  const activeTab = searchParams.get("tab") || "members";
  const page = parseInt(searchParams.get("page") || "0", 10);
  const rowsPerPage = parseInt(searchParams.get("limit") || "10", 10);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", newValue);
      // Reset pagination when tab changes
      next.delete("page");
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", newPage.toString());
      return next;
    });
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("limit", newRowsPerPage.toString());
      next.set("page", "0");
      return next;
    });
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
    handleUpdatePlayer,
    handleRevokeInvitation,
    handleResetInviteLink,
    handleAddAdmin,
    handleRemoveAdmin,
    handleAddPlayers,
    handleInvitePlayer,
    handleDeleteOrganization,
    refreshPlayers,
    fetchData,
  } = useOrganizationManagement(orgId);

  const { user } = useAuth();
  const isAdmin = useMemo(() => {
    if (!user || !admins) return false;
    return admins.some((a) => a.user_id === user.id);
  }, [user, admins]);
  if (loading && !org)
    return (
      <Loading message={t("common.loading")} data-testid="org-mgmt-loading" />
    );
  if (!org)
    return (
      <Container sx={{ mt: 4, px: { xs: 1, sm: 2 } }} disableGutters>
        <Alert severity="error">
          {error || t("organizations.error.load_failed")}
        </Alert>
      </Container>
    );

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0, sm: 2 } }}
      disableGutters
      data-testid="org-mgmt-container"
    >
      <Box sx={{ px: { xs: 1.5, sm: 0 } }}>
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
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
            data-testid="org-mgmt-error"
          >
            {error}
          </Alert>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="organization management tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab
            icon={<PeopleIcon />}
            iconPosition="start"
            label={
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("organizations.management.sections.members")}
              </Box>
            }
            value="members"
            data-testid="mgmt-tab-members"
          />
          <Tab
            icon={<AttachMoneyIcon />}
            iconPosition="start"
            label={
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("organizations.management.sections.finance")}
              </Box>
            }
            value="finance"
            data-testid="mgmt-tab-finance"
          />
          <Tab
            icon={<StarIcon />}
            iconPosition="start"
            label={
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("organizations.detail.button.ratings")}
              </Box>
            }
            value="ratings"
            data-testid="mgmt-tab-ratings"
          />
          <Tab
            icon={<AdminPanelSettingsIcon />}
            iconPosition="start"
            label={
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("organizations.management.sections.admins")}
              </Box>
            }
            value="admins"
            data-testid="mgmt-tab-admins"
          />
          <Tab
            icon={<MailIcon />}
            iconPosition="start"
            label={
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("organizations.management.sections.invitations")}
              </Box>
            }
            value="invitations"
            data-testid="mgmt-tab-invitations"
          />
          <Tab
            icon={<WhatsAppIcon />}
            iconPosition="start"
            label={
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("organizations.management.sections.waha")}
              </Box>
            }
            value="waha"
            data-testid="mgmt-tab-waha"
          />
          <Tab
            icon={<SettingsIcon />}
            iconPosition="start"
            label={
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("common.actions.manage")}
              </Box>
            }
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
            onUpdatePlayer={handleUpdatePlayer}
            actionLoading={actionLoading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </TabPanel>

        <TabPanel value={activeTab} index="finance">
          <FinanceSection orgId={orgId} isAdmin={isAdmin} />
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
            publicInviteLink={publicInviteLink}
            onRevoke={handleRevokeInvitation}
            onResetLink={() => setIsResetConfirmOpen(true)}
            onInviteClick={() => setIsInviteOpen(true)}
            actionLoading={actionLoading}
          />
        </TabPanel>

        <TabPanel value={activeTab} index="waha">
          <WahaConfigSection
            organization={org}
            onUpdateSuccess={() => fetchData(true)}
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
        onResetPublicLink={() => setIsResetConfirmOpen(true)}
        loading={actionLoading}
      />

      <PrettyConfirmDialog
        open={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetInviteLink}
        title={t(
          "organizations.management.reset_invite_link_title",
          "Redefinir Link de Convite",
        )}
        description={t(
          "organizations.management.reset_invite_link_confirm",
          "Tem certeza que deseja redefinir o link de convite? O link atual deixará de funcionar imediatamente.",
        )}
        confirmLabel={t("common.reset", "Redefinir")}
        severity="warning"
      />
    </Container>
  );
}
