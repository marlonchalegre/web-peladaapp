import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Alert,
  Paper,
  Grid,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthContext";
import { Loading } from "../../../shared/components/Loading";
import { useHomeDashboard } from "../hooks/useHomeDashboard";
import PeladasList from "../components/PeladasList";
import ActiveMatchesCarousel from "../components/ActiveMatchesCarousel";
import ConsolidatedOrganizationsList from "../components/ConsolidatedOrganizationsList";
import CreateOrganizationDialog from "../components/CreateOrganizationDialog";
import PendingInvitations from "../components/PendingInvitations";

export default function HomePage() {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <Container
        maxWidth="lg"
        sx={{ py: 3, px: { xs: 1, sm: 2 } }}
        disableGutters
      >
        <Loading message={t("common.loading")} />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}
      disableGutters
    >
      {user.is_blocked && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t(
            "home.blocked_message",
            "Sua conta está bloqueada. Você não pode participar de peladas ou ver estatísticas, mas pode acessar seu perfil.",
          )}
        </Alert>
      )}

      {error && !user.is_blocked && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Loading message={t("common.loading")} />
      ) : user.is_blocked ? null : (
        <>
          {/* Welcome / Dashboard Stats Hero */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 4 },
              mb: 4,
              borderRadius: 4,
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
              color: "white",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              {t("home.welcome.prefix", "Bem-vindo, ")}
              {user.name}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
              {t(
                "home.welcome.subtitle",
                "Aqui está o resumo das suas atividades.",
              )}
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(4px)",
                    color: "white",
                    border: 0,
                    borderRadius: 2.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.8, display: "block", mb: 0.5, fontWeight: 600 }}
                  >
                    ⚽ {t("home.stats.peladas_total", "Peladas Registradas")}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {peladas.length}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(4px)",
                    color: "white",
                    border: 0,
                    borderRadius: 2.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.8, display: "block", mb: 0.5, fontWeight: 600 }}
                  >
                    🛡️ {t("home.stats.groups_active", "Grupos Ativos")}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {adminOrgs.length + memberOrgs.length}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(4px)",
                    color: "white",
                    border: 0,
                    borderRadius: 2.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.8, display: "block", mb: 0.5, fontWeight: 600 }}
                  >
                    👑 {t("home.stats.roles", "Minhas Funções")}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {adminOrgs.length} Admin | {memberOrgs.length} {t("common.roles.player", "Jogador")}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* Pending invitations */}
          <PendingInvitations
            invitations={pendingInvitations}
            onAccept={acceptInvitation}
          />

          {/* Active Matches Carousel */}
          <ActiveMatchesCarousel peladas={peladas} />

          {/* Two-Column Main Layout */}
          <Grid container spacing={4}>
            {/* Left Column: Recent Matches Feed */}
            <Grid size={{ xs: 12, md: 7, lg: 8 }}>
              <PeladasList
                peladas={peladas}
                page={peladasPage}
                totalPages={peladasTotalPages}
                onPageChange={handlePeladaPageChange}
              />
            </Grid>

            {/* Right Column: Groups Sidebar */}
            <Grid size={{ xs: 12, md: 5, lg: 4 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <ConsolidatedOrganizationsList
                  adminOrgs={adminOrgs}
                  memberOrgs={memberOrgs}
                />

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => setCreateDialogOpen(true)}
                  data-testid="create-org-open-dialog"
                  data-analytics-id="create-org-open-btn"
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "none",
                    },
                  }}
                >
                  + {t("home.actions.create_organization", "Criar Organização")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </>
      )}

      <CreateOrganizationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={createOrganization}
        allowOrgCreation={user.allow_org_creation === true}
      />
    </Container>
  );
}
