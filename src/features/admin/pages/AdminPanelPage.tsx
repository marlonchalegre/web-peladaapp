import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Block as BlockIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthContext";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAdminOrganizations } from "../hooks/useAdminOrganizations";
import { UsersTab } from "../components/UsersTab";
import { OrganizationsTab } from "../components/OrganizationsTab";
import { ResetPasswordDialog } from "../components/ResetPasswordDialog";
import { ConfirmDeleteUserDialog } from "../components/ConfirmDeleteUserDialog";
import { ManageOrgAdminsDialog } from "../components/ManageOrgAdminsDialog";
import { ConfirmDeleteOrgDialog } from "../components/ConfirmDeleteOrgDialog";

export default function AdminPanelPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const theme = useTheme();

  // Redirect if not super admin
  useEffect(() => {
    if (currentUser && !currentUser.is_super_admin) {
      navigate("/home");
    }
  }, [currentUser, navigate]);

  // Tab State
  const [tabValue, setTabValue] = useState(0);

  // Action / Feedback States
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<
    "success" | "error" | "info"
  >("success");

  const showToast = useCallback(
    (message: string, severity: "success" | "error" | "info" = "success") => {
      setToastMessage(message);
      setToastSeverity(severity);
      setToastOpen(true);
    },
    [],
  );

  const adminUsers = useAdminUsers({ showToast, currentUser });
  const adminOrgs = useAdminOrganizations({ showToast });

  // Load Initial Data & on Tab Switch
  useEffect(() => {
    if (tabValue === 0) {
      adminUsers.fetchUsers(adminUsers.userQuery, adminUsers.userPage);
    } else {
      adminOrgs.fetchOrganizations(adminOrgs.orgQuery, adminOrgs.orgPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tabValue,
    adminUsers.userPage,
    adminOrgs.orgPage,
    adminUsers.fetchUsers,
    adminOrgs.fetchOrganizations,
  ]);

  if (!currentUser || !currentUser.is_super_admin) {
    return (
      <Container sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <BreadcrumbNav
        items={[{ label: t("navigation.adminPanel", "Painel de Admin") }]}
      />

      {/* Hero / Gradient Title Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: "16px",
          p: { xs: 3, md: 5 },
          mb: 4,
          boxShadow: `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.25)}`,
          color: "#fff",
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}
        >
          {t("admin.title", "Painel do Super Admin")}
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          {t(
            "admin.subtitle",
            "Gerencie organizações, bloqueie usuários e administre as permissões globais do sistema.",
          )}
        </Typography>
      </Box>

      {/* Tabs Menu */}
      <Paper
        sx={{ mb: 4, borderRadius: "12px", overflow: "hidden" }}
        elevation={0}
        variant="outlined"
      >
        <Tabs
          value={tabValue}
          onChange={(_, val) => setTabValue(val)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label={t("admin.tabs.users", "Usuários")}
            icon={<AdminIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            sx={{ fontWeight: 600, py: 2 }}
          />
          <Tab
            label={t("admin.tabs.organizations", "Organizações")}
            icon={<BlockIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            sx={{ fontWeight: 600, py: 2 }}
          />
        </Tabs>
      </Paper>

      {/* Users Tab Panel */}
      {tabValue === 0 && (
        <UsersTab
          users={adminUsers.users}
          usersLoading={adminUsers.usersLoading}
          userQuery={adminUsers.userQuery}
          setUserQuery={adminUsers.setUserQuery}
          userPage={adminUsers.userPage}
          userTotalPages={adminUsers.userTotalPages}
          onPageChange={(p) => {
            adminUsers.setUserPage(p);
            adminUsers.fetchUsers(adminUsers.userQuery, p);
          }}
          onSearchSubmit={adminUsers.handleUserSearch}
          onRefresh={() =>
            adminUsers.fetchUsers(adminUsers.userQuery, adminUsers.userPage)
          }
          onToggleBlock={adminUsers.handleToggleUserBlock}
          onToggleOrgCreation={adminUsers.handleToggleUserOrgCreation}
          onToggleSuperAdmin={adminUsers.handleToggleUserSuperAdmin}
          onOpenResetPassword={adminUsers.handleOpenResetPassword}
          onOpenDeleteUser={adminUsers.handleOpenDeleteUser}
          actionInProgress={adminUsers.actionInProgress}
          currentUser={currentUser}
        />
      )}

      {/* Organizations Tab Panel */}
      {tabValue === 1 && (
        <OrganizationsTab
          organizations={adminOrgs.organizations}
          organizationsLoading={adminOrgs.organizationsLoading}
          orgQuery={adminOrgs.orgQuery}
          setOrgQuery={adminOrgs.setOrgQuery}
          orgPage={adminOrgs.orgPage}
          orgTotalPages={adminOrgs.orgTotalPages}
          onPageChange={(p) => {
            adminOrgs.setOrgPage(p);
            adminOrgs.fetchOrganizations(adminOrgs.orgQuery, p);
          }}
          onSearchSubmit={adminOrgs.handleOrgSearch}
          onRefresh={() =>
            adminOrgs.fetchOrganizations(adminOrgs.orgQuery, adminOrgs.orgPage)
          }
          onToggleBlock={adminOrgs.handleToggleOrgBlock}
          onOpenManageAdmins={adminOrgs.handleOpenManageAdmins}
          onOpenDeleteOrg={adminOrgs.handleOpenDeleteOrg}
          actionInProgress={adminOrgs.actionInProgress}
        />
      )}

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={Boolean(adminUsers.resetPasswordUser)}
        onClose={() => adminUsers.setResetPasswordUser(null)}
        user={adminUsers.resetPasswordUser}
        value={adminUsers.resetPasswordValue}
        onChange={adminUsers.setResetPasswordValue}
        error={adminUsers.resetPasswordError}
        loading={adminUsers.resetPasswordLoading}
        onConfirm={adminUsers.handleConfirmResetPassword}
      />

      {/* Confirm Delete User Dialog */}
      <ConfirmDeleteUserDialog
        open={Boolean(adminUsers.deleteUserTarget)}
        onClose={() => adminUsers.setDeleteUserTarget(null)}
        user={adminUsers.deleteUserTarget}
        loading={adminUsers.deleteUserLoading}
        onConfirm={adminUsers.handleConfirmDeleteUser}
      />

      {/* Manage Org Admins Dialog */}
      <ManageOrgAdminsDialog
        open={Boolean(adminOrgs.manageAdminsOrg)}
        onClose={() => adminOrgs.setManageAdminsOrg(null)}
        organization={adminOrgs.manageAdminsOrg}
        showToast={showToast}
      />

      {/* Confirm Delete Org Dialog */}
      <ConfirmDeleteOrgDialog
        open={Boolean(adminOrgs.deleteOrgTarget)}
        onClose={() => adminOrgs.setDeleteOrgTarget(null)}
        organization={adminOrgs.deleteOrgTarget}
        loading={adminOrgs.deleteOrgLoading}
        onConfirm={adminOrgs.handleConfirmDeleteOrg}
      />

      {/* Snackbar notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
