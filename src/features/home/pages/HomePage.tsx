import { useState } from "react";
import { Container, Box, Typography, Alert } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthContext";
import { Loading } from "../../../shared/components/Loading";
import { useHomeDashboard } from "../hooks/useHomeDashboard";
import PeladasList from "../components/PeladasList";
import AdminOrganizationsList from "../components/AdminOrganizationsList";
import MemberOrganizationsList from "../components/MemberOrganizationsList";
import CreateOrganizationDialog from "../components/CreateOrganizationDialog";
import PendingInvitations from "../components/PendingInvitations";

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const {
    loading,
    error,
    adminOrgs,
    memberOrgs,
    pendingInvitations,
    peladas,
    peladasPage,
    peladasTotalPages,
    handlePeladaPageChange,
    acceptInvitation,
    createOrganization,
  } = useHomeDashboard();

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Loading message={t("common.loading")} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header / Welcome Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 5,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}
          >
            {t("home.welcome.prefix", "Bem-vindo, ")}
            <Box component="span" sx={{ color: "primary.main" }}>
              {user.name}
            </Box>
            !
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            {t(
              "home.welcome.subtitle",
              "Aqui está o resumo das suas atividades.",
            )}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Loading message={t("common.loading")} />
      ) : (
        <>
          <PendingInvitations
            invitations={pendingInvitations}
            onAccept={acceptInvitation}
          />

          <PeladasList
            peladas={peladas}
            page={peladasPage}
            totalPages={peladasTotalPages}
            onPageChange={handlePeladaPageChange}
          />

          <AdminOrganizationsList
            organizations={adminOrgs}
            onCreate={() => setCreateDialogOpen(true)}
          />

          <MemberOrganizationsList organizations={memberOrgs} />
        </>
      )}

      <CreateOrganizationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={createOrganization}
      />
    </Container>
  );
}
