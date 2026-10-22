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
  alpha,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import MailIcon from "@mui/icons-material/Mail";
import StarIcon from "@mui/icons-material/Star";
import SettingsIcon from "@mui/icons-material/Settings";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
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
import MonthlyWaitlistSection from "../components/MonthlyWaitlistSection";
import InvitationsList from "../components/InvitationsList";
import DangerZoneSection from "../components/DangerZoneSection";
import WahaConfigSection from "../components/WahaConfigSection";
import DeleteOrganizationDialog from "../components/DeleteOrganizationDialog";
import PlayerRatingsContent from "../components/PlayerRatingsContent";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";
import GroupTabsBar, { type GroupTabKey } from "../components/GroupTabsBar";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
import { PremiumFeatureLock } from "../../../shared/components/PremiumFeatureLock";
import GeneralSettingsSection from "../components/GeneralSettingsSection";
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

  const requestedTab = searchParams.get("tab") || "members";
  const page = parseInt(searchParams.get("page") || "0", 10);
  const rowsPerPage = parseInt(searchParams.get("limit") || "10", 10);

  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    severity: "success" | "error" | "info";
  } | null>(null);

  const showToast = (
    message: string,
    severity: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, severity });
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
    waitlist,
    handleAddWaitlistCandidate,
    handleRemoveWaitlistCandidate,
    handlePromoteWaitlistCandidate,
    refreshPlayers,
    fetchInviteLink,
    fetchData,
    featureFlags,
  } = useOrganizationManagement(orgId);

  const { user } = useAuth();
  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (user.is_super_admin) return true;
    if (org?.owner_id === user.id) return true;
    if (!admins) return false;
    return admins.some((a) => a.user_id === user.id);
  }, [user, admins, org]);

  const tabsConfig = useMemo(
    () => [
      {
        value: "members",
        icon: <PeopleIcon />,
        label: t("organizations.management.sections.members"),
        adminOnly: false,
      },
      {
        value: "finance",
        icon: <AttachMoneyIcon />,
        label: t("organizations.management.sections.finance"),
        adminOnly: true,
      },
      {
        value: "substitutions",
        icon: <SwapHorizIcon />,
        label: t(
          "organizations.management.sections.substitutions",
          "Substitutions",
        ),
        adminOnly: false,
      },
      {
        value: "waitlist",
        icon: <FormatListNumberedIcon />,
        label: t("organizations.management.sections.waitlist", "Waitlist"),
        adminOnly: false,
      },
      {
        value: "ratings",
        icon: <StarIcon />,
        label: t("organizations.detail.button.ratings"),
        adminOnly: false,
      },
      {
        value: "admins",
        icon: <AdminPanelSettingsIcon />,
        label: t("organizations.management.sections.admins"),
        adminOnly: true,
      },
      {
        value: "invitations",
        icon: <MailIcon />,
        label: t("organizations.management.sections.invitations"),
        adminOnly: true,
      },
      {
        value: "waha",
        icon: <WhatsAppIcon />,
        label: t("organizations.management.sections.waha"),
        adminOnly: true,
      },
      {
        value: "settings",
        icon: <SettingsIcon />,
        label: t("common.actions.manage"),
        adminOnly: true,
      },
    ],
    [t],
  );

  const visibleTabs = useMemo(
    () => tabsConfig.filter((tab) => isAdmin || !tab.adminOnly),
    [tabsConfig, isAdmin],
  );

  const activeTab = useMemo(() => {
    const requestedConfig = tabsConfig.find(
      (tab) => tab.value === requestedTab,
    );
    if (!isAdmin && requestedConfig?.adminOnly) {
      return "members";
    }
    return requestedTab;
  }, [isAdmin, requestedTab, tabsConfig]);

  const excludeUserIds = useMemo(
    () => new Set(players.map((p) => p.user_id)),
    [players],
  );

  const renderPremiumLock = (
    key: string,
    defaults: {
      title: string;
      description: string;
      benefits: [string, string, string];
    },
  ) => (
    <PremiumFeatureLock
      title={t(`common.premium.${key}_title`, defaults.title)}
      description={t(`common.premium.${key}_description`, defaults.description)}
      benefits={[
        t(`common.premium.${key}_benefit1`, defaults.benefits[0]),
        t(`common.premium.${key}_benefit2`, defaults.benefits[1]),
        t(`common.premium.${key}_benefit3`, defaults.benefits[2]),
      ]}
    />
  );

  const groupTab: GroupTabKey =
    activeTab === "finance"
      ? "finance"
      : activeTab === "settings"
        ? "settings"
        : "roster";

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
    <Box
      sx={{
        width: "100%",
        bgcolor: "background.default",
        minHeight: "100vh",
        pb: { xs: 2, sm: 4 },
      }}
      data-testid="org-mgmt-container"
    >
      <GroupTabsBar
        orgId={orgId}
        orgName={org.name}
        active={groupTab}
        playersCount={players.length}
        isAdmin={isAdmin}
      />
      <Box sx={{ maxWidth: 1124, mx: "auto", px: { xs: 2, md: 4, lg: 5 } }}>
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
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "24px",
              color: "text.primary",
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
            borderBottom: "1.5px solid",
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
            sx={{
              minHeight: 46,
              "& .MuiTab-root": {
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "11.5px",
                letterSpacing: ".04em",
                textTransform: "uppercase",
                color: "text.secondary",
                minHeight: 46,
              },
              "& .MuiTab-root.Mui-selected": { color: "text.primary" },
              "& .MuiTabs-indicator": {
                backgroundColor: "text.primary",
                height: 3,
              },
            }}
          >
            {visibleTabs.map((tab) => (
              <Tab
                key={tab.value}
                icon={tab.icon}
                iconPosition="start"
                label={
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    {tab.label}
                  </Box>
                }
                value={tab.value}
                data-testid={`mgmt-tab-${tab.value}`}
              />
            ))}
          </Tabs>
        </Paper>
        <Box sx={{ mt: 2 }}>
          <TabPanel value={activeTab} index="members">
            <MembersSection
              players={players}
              usersMap={usersMap}
              isAdmin={isAdmin}
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
              renderPremiumLock("finance", {
                title: "Controle Financeiro Premium",
                description:
                  "Monitore o fluxo de caixa, pagamentos de mensalistas e diaristas, e controle a saúde financeira do seu grupo.",
                benefits: [
                  "Fluxo de caixa completo de receitas e despesas",
                  "Acompanhamento detalhado de pagamentos por jogador",
                  "Histórico completo de transações da organização",
                ],
              })
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
              renderPremiumLock("substitutions", {
                title: "Substituições de Mensalistas",
                description:
                  "Gerencie o afastamento temporário ou definitivo de mensalistas e a substituição por diaristas de forma automática.",
                benefits: [
                  "Substituições temporárias com data de término",
                  "Substituições permanentes de membros",
                  "Histórico de substituições realizadas",
                ],
              })
            )}
          </TabPanel>

          <TabPanel value={activeTab} index="waitlist">
            <MonthlyWaitlistSection
              waitlist={waitlist}
              players={players}
              onAddCandidate={async (playerId) => {
                await handleAddWaitlistCandidate(playerId);
                showToast(t("organizations.management.waitlist.success.added"));
              }}
              onRemoveCandidate={async (playerId) => {
                await handleRemoveWaitlistCandidate(playerId);
                showToast(
                  t("organizations.management.waitlist.success.removed"),
                );
              }}
              onPromoteCandidate={async (playerId) => {
                await handlePromoteWaitlistCandidate(playerId);
                showToast(
                  t("organizations.management.waitlist.success.promoted"),
                );
              }}
              actionLoading={actionLoading}
            />
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
              renderPremiumLock("characteristics", {
                title: "Avaliações e Características de Jogadores",
                description:
                  "Defina os atributos técnicos e físicos de seus atletas para gerar gráficos de radar personalizados.",
                benefits: [
                  "Gráficos de radar de habilidades de 6 eixos",
                  "Atributos personalizados (Chute, Velocidade, Passe, etc.)",
                  "Melhor balanceamento de times baseado em dados reais",
                ],
              })
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
              renderPremiumLock("waha", {
                title: "Comunicações Automatizadas via WhatsApp",
                description:
                  "Integre sua organização com o WhatsApp para automatizar notificações de peladas, presenças e listas de espera.",
                benefits: [
                  "Notificações automáticas de novos eventos",
                  "Alertas de confirmação de presença",
                  "Integração direta com o serviço WAHA API",
                ],
              })
            )}
          </TabPanel>

          <TabPanel value={activeTab} index="settings">
            {isAdmin && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <GeneralSettingsSection
                  organization={org}
                  onUpdateSuccess={() => fetchData(true)}
                />

                {/* WhatsApp Communications Card */}
                <Box
                  sx={{
                    background: (theme) =>
                      alpha(theme.palette.background.paper, 0.45),
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
          excludeUserIds={excludeUserIds}
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
          open={Boolean(toast)}
          autoHideDuration={4000}
          onClose={() => setToast(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() => setToast(null)}
            severity={toast?.severity || "success"}
            sx={{ width: "100%", borderRadius: "8px" }}
          >
            {toast?.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
