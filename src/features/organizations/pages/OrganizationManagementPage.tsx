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
  Button,
  Snackbar,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import MailIcon from "@mui/icons-material/Mail";
import StarIcon from "@mui/icons-material/Star";
import SettingsIcon from "@mui/icons-material/Settings";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SendIcon from "@mui/icons-material/Send";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthContext";
import { Loading } from "../../../shared/components/Loading";
import AddPlayersDialog from "../components/AddPlayersDialog";
import InvitePlayerDialog from "../components/InvitePlayerDialog";
import { useOrganizationManagement } from "../hooks/useOrganizationManagement";
import MembersSection from "../components/MembersSection";
import FinanceSection from "../components/FinanceSection";
import AdminsSection from "../components/AdminsSection";
import SubstitutionsSection from "../components/SubstitutionsSection";
import InvitationsList from "../components/InvitationsList";
import DangerZoneSection from "../components/DangerZoneSection";
import WahaConfigSection from "../components/WahaConfigSection";
import DeleteOrganizationDialog from "../components/DeleteOrganizationDialog";
import PlayerRatingsContent from "../components/PlayerRatingsContent";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
import { PremiumFeatureLock } from "../../../shared/components/PremiumFeatureLock";
import SendNotificationDialog from "../components/SendNotificationDialog";

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
  const orgId = id!;

  const activeTab = searchParams.get("tab") || "members";
  const page = parseInt(searchParams.get("page") || "0", 10);
  const rowsPerPage = parseInt(searchParams.get("limit") || "10", 10);

  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<
    "success" | "error" | "info"
  >("success");

  const showToast = (
    message: string,
    severity: "success" | "error" | "info" = "success",
  ) => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

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
    substitutions,
    loading,
    error,
    setError,
    actionLoading,
    isAddPlayersOpen,
    setIsAddPlayersOpen,
    isInviteOpen,
    setIsInviteOpen,
    publicInviteLink,
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
    handleCreateSubstitution,
    handleEndSubstitution,
    refreshPlayers,
    fetchInviteLink,
    fetchData,
    featureFlags,
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

        <Typography
          variant="h4"
          gutterBottom
          color="primary"
          sx={{
            fontWeight: "bold",
          }}
        >
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
            icon={<SwapHorizIcon />}
            iconPosition="start"
            label={
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t(
                  "organizations.management.sections.substitutions",
                  "Substitutions",
                )}
              </Box>
            }
            value="substitutions"
            data-testid="mgmt-tab-substitutions"
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
          {featureFlags?.finance_control !== false ? (
            <FinanceSection orgId={orgId} isAdmin={isAdmin} />
          ) : (
            <PremiumFeatureLock
              title={t(
                "common.premium.finance_title",
                "Controle Financeiro Premium",
              )}
              description={t(
                "common.premium.finance_description",
                "Monitore o fluxo de caixa, pagamentos de mensalistas e diaristas, e controle a saúde financeira do seu grupo.",
              )}
              benefits={[
                t(
                  "common.premium.finance_benefit1",
                  "Fluxo de caixa completo de receitas e despesas",
                ),
                t(
                  "common.premium.finance_benefit2",
                  "Acompanhamento detalhado de pagamentos por jogador",
                ),
                t(
                  "common.premium.finance_benefit3",
                  "Histórico completo de transações da organização",
                ),
              ]}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index="substitutions">
          {featureFlags?.monthly_substitutions !== false ? (
            <SubstitutionsSection
              players={players}
              substitutions={substitutions}
              onCreateSubstitution={handleCreateSubstitution}
              onEndSubstitution={handleEndSubstitution}
              actionLoading={actionLoading}
            />
          ) : (
            <PremiumFeatureLock
              title={t(
                "common.premium.substitutions_title",
                "Substituições de Mensalistas",
              )}
              description={t(
                "common.premium.substitutions_description",
                "Gerencie o afastamento temporário ou definitivo de mensalistas e a substituição por diaristas de forma automática.",
              )}
              benefits={[
                t(
                  "common.premium.substitutions_benefit1",
                  "Substituições temporárias com data de término",
                ),
                t(
                  "common.premium.substitutions_benefit2",
                  "Substituições permanentes de membros",
                ),
                t(
                  "common.premium.substitutions_benefit3",
                  "Histórico de substituições realizadas",
                ),
              ]}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index="ratings">
          {featureFlags?.player_characteristics !== false ? (
            <PlayerRatingsContent
              orgId={orgId}
              initialPlayers={players}
              orgName={org.name}
              onUpdateSuccess={refreshPlayers}
            />
          ) : (
            <PremiumFeatureLock
              title={t(
                "common.premium.characteristics_title",
                "Avaliações e Características de Jogadores",
              )}
              description={t(
                "common.premium.characteristics_description",
                "Defina os atributos técnicos e físicos de seus atletas para gerar gráficos de radar personalizados.",
              )}
              benefits={[
                t(
                  "common.premium.characteristics_benefit1",
                  "Gráficos de radar de habilidades de 6 eixos",
                ),
                t(
                  "common.premium.characteristics_benefit2",
                  "Atributos personalizados (Chute, Velocidade, Passe, etc.)",
                ),
                t(
                  "common.premium.characteristics_benefit3",
                  "Melhor balanceamento de times baseado em dados reais",
                ),
              ]}
            />
          )}
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
          {featureFlags?.waha_communications !== false ? (
            <WahaConfigSection
              organization={org}
              onUpdateSuccess={() => fetchData(true)}
            />
          ) : (
            <PremiumFeatureLock
              title={t(
                "common.premium.waha_title",
                "Comunicações Automatizadas via WhatsApp",
              )}
              description={t(
                "common.premium.waha_description",
                "Integre sua organização com o WhatsApp para automatizar notificações de peladas, presenças e listas de espera.",
              )}
              benefits={[
                t(
                  "common.premium.waha_benefit1",
                  "Notificações automáticas de novos eventos",
                ),
                t(
                  "common.premium.waha_benefit2",
                  "Alertas de confirmação de presença",
                ),
                t(
                  "common.premium.waha_benefit3",
                  "Integração direta com o serviço WAHA API",
                ),
              ]}
            />
          )}
        </TabPanel>

        <TabPanel value={activeTab} index="settings">
          {isAdmin && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* WhatsApp Communications Card */}
              <Box
                sx={{
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(25, 25, 25, 0.45)"
                      : "rgba(255, 255, 255, 0.45)",
                  backdropFilter: "blur(20px)",
                  borderRadius: "16px",
                  p: 3,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <WhatsAppIcon color="success" />
                  {t(
                    "organizations.management.notifications.card_title",
                    "Comunicações WhatsApp",
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {t(
                    "organizations.management.notifications.card_desc",
                    "Envie mensagens personalizadas ou reenvie convocações, escalações e resultados diretamente para o grupo de WhatsApp da organização.",
                  )}
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => setIsSendNotificationOpen(true)}
                  startIcon={<SendIcon />}
                  sx={{ borderRadius: "10px", textTransform: "none" }}
                  data-testid="open-send-notification-btn"
                >
                  {t(
                    "organizations.management.notifications.button_send",
                    "Enviar Notificação",
                  )}
                </Button>
              </Box>

              <DangerZoneSection
                orgName={org.name}
                onDeleteClick={() => setIsDeleteDialogOpen(true)}
                actionLoading={actionLoading}
              />
            </Box>
          )}
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
      <SendNotificationDialog
        open={isSendNotificationOpen}
        onClose={() => setIsSendNotificationOpen(false)}
        organization={org}
        showToast={showToast}
      />
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
