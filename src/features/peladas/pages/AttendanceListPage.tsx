import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo, type SyntheticEvent } from "react";
import {
  Container,
  Typography,
  Alert,
  Button,
  Box,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { useAttendance } from "../hooks/useAttendance";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import { createApi } from "../../../shared/api/endpoints";
import UserAttendanceStatus from "../components/UserAttendanceStatus";
import AttendanceListColumn from "../components/AttendanceListColumn";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: { xs: 2, sm: 3 }, px: { xs: 0, sm: 1 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AttendanceListPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = Number(id);
  const { user } = useAuth();
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const {
    pelada,
    confirmed,
    waitlist,
    declined,
    pending,
    isAdmin,
    loading,
    error,
    updatingPlayers,
    currentPlayerAsPlayer,
    isUpdatingSelf,
    peladaTransactions,
    organizationFinance,
    handleUpdateAttendance,
    handleCloseAttendance,
    handleMarkPaid,
    handleReversePayment,
  } = useAttendance(peladaId);

  const [isReverseDialogOpen, setIsReverseDialogOpen] = useState(false);
  const [playerToReverse, setPlayerToReverse] = useState<number | null>(null);

  // Derived admin status
  const isAnyAdmin = useMemo(() => {
    return !!(
      pelada?.is_admin ||
      isAdmin ||
      isOrgAdmin ||
      (user &&
        pelada?.organization_id &&
        (pelada.creator_id === user.id ||
          user.admin_orgs?.includes(pelada.organization_id)))
    );
  }, [pelada, isAdmin, isOrgAdmin, user]);

  const handleConfirmReverse = () => {
    if (playerToReverse !== null) {
      handleReversePayment(playerToReverse);
      setPlayerToReverse(null);
    }
    setIsReverseDialogOpen(false);
  };

  const onReverseClick = (playerId: number) => {
    setPlayerToReverse(playerId);
    setIsReverseDialogOpen(true);
  };

  const onConfirmClose = () => {
    handleCloseAttendance();
    setIsConfirmDialogOpen(false);
  };

  useEffect(() => {
    if (pelada?.organization_id && user && !isAnyAdmin) {
      const endpoints = createApi(api);
      endpoints
        .listAdminsByOrganization(pelada.organization_id)
        .then((admins) => {
          if (admins.some((a) => a.user_id === user.id)) {
            setIsOrgAdmin(true);
          }
        })
        .catch((err) => console.error("Failed to check admin status", err));
    }
  }, [pelada?.organization_id, user, isAnyAdmin]);

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading && !pelada) return <Loading message={t("common.loading")} />;
  if (error)
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  if (!pelada)
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">{t("peladas.error.not_found")}</Alert>
      </Container>
    );

  return (
    <Container
      maxWidth="md"
      sx={{ py: { xs: 2, md: 4 }, px: { xs: 0.5, sm: 2, md: 3 } }}
      disableGutters
    >
      <Box sx={{ px: { xs: 1.5, sm: 0 } }}>
        <BreadcrumbNav
          items={[
            {
              label: pelada.organization_name || t("common.organization"),
              path: `/organizations/${pelada.organization_id}`,
            },
            {
              label: t("peladas.detail.title", { id: pelada.id }),
              path: `/peladas/${pelada.id}`,
            },
            { label: t("peladas.attendance.title") },
          ]}
        />
      </Box>
      <div data-testid="attendance-list-container">
        <Box
          sx={{
            mb: 3,
            px: { xs: 1.5, sm: 0 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box />
          {isAnyAdmin && (
            <Button
              variant="contained"
              onClick={() => setIsConfirmDialogOpen(true)}
              data-testid="close-attendance-button"
              sx={{
                borderRadius: 3,
                bgcolor: "success.main",
                "&:hover": {
                  bgcolor: "success.dark",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(22, 101, 52, 0.2)",
                },
                px: { xs: 0, sm: 3 },
                py: 1,
                minWidth: { xs: "40px", sm: "auto" },
                textTransform: "none",
                fontWeight: 800,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SportsSoccerIcon sx={{ mr: { xs: 0, sm: 1 } }} />
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("peladas.attendance.button.close_list")}
              </Box>
            </Button>
          )}
        </Box>

        <Box sx={{ mb: 4, px: { xs: 1.5, sm: 0 } }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 800, mb: 1, letterSpacing: -0.5 }}
          >
            {t("peladas.attendance.title")}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t("peladas.attendance.subtitle")}
          </Typography>
        </Box>

        <Box sx={{ px: { xs: 1.5, sm: 0 } }}>
          {currentPlayerAsPlayer && (
            <UserAttendanceStatus
              player={currentPlayerAsPlayer}
              isUpdating={isUpdatingSelf}
              onUpdate={(status) => handleUpdateAttendance(status)}
            />
          )}
        </Box>

        <Box sx={{ width: "100%", mt: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="attendance tabs"
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: "bold",
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  py: 1.5,
                  minWidth: { xs: 120, sm: 160 },
                  flex: { sm: 1 },
                },
                "& .MuiTabs-flexContainer": {
                  justifyContent: { sm: "space-between" },
                },
              }}
            >
              <Tab
                icon={
                  <Badge
                    badgeContent={confirmed.length}
                    color="success"
                    sx={{
                      "& .MuiBadge-badge": {
                        display: { xs: "flex", md: "none" },
                      },
                    }}
                  >
                    <PeopleIcon />
                  </Badge>
                }
                iconPosition="start"
                label={
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", md: "inline" } }}
                  >{`${t("peladas.attendance.status.confirmed")} (${confirmed.length})`}</Box>
                }
              />
              <Tab
                icon={
                  <Badge
                    badgeContent={waitlist.length}
                    color="warning"
                    sx={{
                      "& .MuiBadge-badge": {
                        display: { xs: "flex", md: "none" },
                      },
                    }}
                  >
                    <AccessTimeIcon />
                  </Badge>
                }
                iconPosition="start"
                label={
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", md: "inline" } }}
                  >{`${t("peladas.attendance.status.waitlist", "Lista de Espera")} (${waitlist.length})`}</Box>
                }
              />
              <Tab
                icon={
                  <Badge
                    badgeContent={pending.length}
                    color="error"
                    sx={{
                      "& .MuiBadge-badge": {
                        display: { xs: "flex", md: "none" },
                      },
                    }}
                  >
                    <HelpOutlineIcon />
                  </Badge>
                }
                iconPosition="start"
                label={
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", md: "inline" } }}
                  >{`${t("peladas.attendance.status.pending")} (${pending.length})`}</Box>
                }
              />
              <Tab
                icon={
                  <Badge
                    badgeContent={declined.length}
                    color="default"
                    sx={{
                      "& .MuiBadge-badge": {
                        display: { xs: "flex", md: "none" },
                      },
                    }}
                  >
                    <PersonOffIcon />
                  </Badge>
                }
                iconPosition="start"
                label={
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", md: "inline" } }}
                  >{`${t("peladas.attendance.status.declined")} (${declined.length})`}</Box>
                }
              />
            </Tabs>
          </Box>

          <CustomTabPanel value={tabValue} index={0}>
            <AttendanceListColumn
              title={t("peladas.attendance.status.confirmed")}
              count={confirmed.length}
              players={confirmed}
              emptyMessage={t("peladas.attendance.empty.confirmed")}
              isAdmin={isAnyAdmin}
              currentUserId={currentPlayerAsPlayer?.user_id}
              onUpdate={handleUpdateAttendance}
              updatingPlayers={updatingPlayers}
              hideHeader
              peladaTransactions={peladaTransactions}
              organizationFinance={organizationFinance || undefined}
              onMarkPaid={handleMarkPaid}
              onReversePayment={onReverseClick}
            />
          </CustomTabPanel>
          <CustomTabPanel value={tabValue} index={1}>
            <AttendanceListColumn
              title={t("peladas.attendance.status.waitlist", "Lista de Espera")}
              count={waitlist.length}
              players={waitlist}
              emptyMessage={t(
                "peladas.attendance.empty.waitlist",
                "Nenhum jogador na lista de espera",
              )}
              isAdmin={isAnyAdmin}
              currentUserId={currentPlayerAsPlayer?.user_id}
              onUpdate={handleUpdateAttendance}
              updatingPlayers={updatingPlayers}
              hideHeader
              peladaTransactions={peladaTransactions}
              organizationFinance={organizationFinance || undefined}
              onMarkPaid={handleMarkPaid}
              onReversePayment={onReverseClick}
            />
          </CustomTabPanel>
          <CustomTabPanel value={tabValue} index={2}>
            <AttendanceListColumn
              title={t("peladas.attendance.status.pending")}
              count={pending.length}
              players={pending}
              emptyMessage={t("peladas.attendance.empty.pending")}
              isAdmin={isAnyAdmin}
              currentUserId={currentPlayerAsPlayer?.user_id}
              onUpdate={handleUpdateAttendance}
              updatingPlayers={updatingPlayers}
              hideHeader
              peladaTransactions={peladaTransactions}
              organizationFinance={organizationFinance || undefined}
              onMarkPaid={handleMarkPaid}
              onReversePayment={onReverseClick}
            />
          </CustomTabPanel>
          <CustomTabPanel value={tabValue} index={3}>
            <AttendanceListColumn
              title={t("peladas.attendance.status.declined")}
              count={declined.length}
              players={declined}
              emptyMessage={t("peladas.attendance.empty.declined")}
              isAdmin={isAnyAdmin}
              currentUserId={currentPlayerAsPlayer?.user_id}
              onUpdate={handleUpdateAttendance}
              updatingPlayers={updatingPlayers}
              hideHeader
              peladaTransactions={peladaTransactions}
              organizationFinance={organizationFinance || undefined}
              onMarkPaid={handleMarkPaid}
              onReversePayment={onReverseClick}
            />
          </CustomTabPanel>
        </Box>
      </div>

      <Dialog
        open={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        aria-labelledby="confirm-close-dialog-title"
        aria-describedby="confirm-close-dialog-description"
      >
        <DialogTitle id="confirm-close-dialog-title">
          {t("peladas.attendance.dialog.close_title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-close-dialog-description">
            {t("peladas.attendance.dialog.close_content")}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setIsConfirmDialogOpen(false)}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {t("peladas.attendance.dialog.cancel")}
          </Button>
          <Button
            onClick={onConfirmClose}
            variant="contained"
            color="success"
            autoFocus
            data-testid="confirm-close-attendance-button"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {t("peladas.attendance.dialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      <PrettyConfirmDialog
        open={isReverseDialogOpen}
        onClose={() => {
          setIsReverseDialogOpen(false);
          setPlayerToReverse(null);
        }}
        onConfirm={handleConfirmReverse}
        title={t("organizations.management.finance.monthly_fees.reverse")}
        description={t(
          "organizations.management.finance.monthly_fees.reverse_confirm",
        )}
        confirmLabel={t(
          "organizations.management.finance.monthly_fees.reverse",
        )}
        severity="warning"
      />
    </Container>
  );
}
