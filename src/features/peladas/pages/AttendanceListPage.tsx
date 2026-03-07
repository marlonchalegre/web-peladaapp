import { useParams, Link as RouterLink } from "react-router-dom";
import { useState, useEffect, type SyntheticEvent } from "react";
import {
  Container,
  Typography,
  Alert,
  Button,
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleIcon from "@mui/icons-material/People";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { useAttendance } from "../hooks/useAttendance";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import { createApi } from "../../../shared/api/endpoints";
import UserAttendanceStatus from "../components/UserAttendanceStatus";
import AttendanceListColumn from "../components/AttendanceListColumn";

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AttendanceListPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = Number(id);
  const { user } = useAuth();
  const [actuallyIsAdmin, setActuallyIsAdmin] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const {
    pelada,
    confirmed,
    declined,
    pending,
    isAdmin,
    loading,
    error,
    updatingPlayers,
    currentPlayerAsPlayer,
    isUpdatingSelf,
    handleUpdateAttendance,
    handleCloseAttendance,
  } = useAttendance(peladaId);

  const isAnyAdmin = pelada?.is_admin || isAdmin || actuallyIsAdmin;

  useEffect(() => {
    if (pelada?.organization_id && user) {
      const endpoints = createApi(api);
      endpoints
        .listAdminsByOrganization(pelada.organization_id)
        .then((admins) => {
          if (admins.some((a) => a.user_id === user.id)) {
            setActuallyIsAdmin(true);
          }
        });
    }
  }, [pelada?.organization_id, user]);

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
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <div data-testid="attendance-list-container">
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            component={RouterLink}
            to={`/organizations/${pelada.organization_id}`}
            startIcon={<ArrowBackIcon />}
            variant="text"
            sx={{ color: "text.secondary", textTransform: "none" }}
          >
            {t("common.back")}
          </Button>
          {isAnyAdmin && (
            <Button
              variant="contained"
              onClick={handleCloseAttendance}
              data-testid="close-attendance-button"
              startIcon={<SportsSoccerIcon />}
              sx={{
                borderRadius: 3,
                bgcolor: "success.main",
                "&:hover": {
                  bgcolor: "success.dark",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(22, 101, 52, 0.2)",
                },
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 800,
                transition: "all 0.2s ease",
              }}
            >
              {t("peladas.attendance.button.close_list")}
            </Button>
          )}
        </Box>

        <Box sx={{ mb: 4 }}>
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

        {currentPlayerAsPlayer && (
          <UserAttendanceStatus
            player={currentPlayerAsPlayer}
            isUpdating={isUpdatingSelf}
            onUpdate={(status) => handleUpdateAttendance(status)}
          />
        )}

        <Box sx={{ width: "100%", mt: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              aria-label="attendance tabs"
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  py: 2,
                },
              }}
            >
              <Tab
                icon={<PeopleIcon />}
                iconPosition="start"
                label={`${t("peladas.attendance.status.confirmed")} (${confirmed.length})`}
              />
              <Tab
                icon={<HelpOutlineIcon />}
                iconPosition="start"
                label={`${t("peladas.attendance.status.pending")} (${pending.length})`}
              />
              <Tab
                icon={<PersonOffIcon />}
                iconPosition="start"
                label={`${t("peladas.attendance.status.declined")} (${declined.length})`}
              />
            </Tabs>
          </Box>

          <CustomTabPanel value={tabValue} index={0}>
            <AttendanceListColumn
              title={t("peladas.attendance.status.confirmed")}
              count={confirmed.length}
              players={confirmed}
              emptyMessage={t("peladas.attendance.empty.confirmed")}
              isAdmin={isAdmin}
              currentUserId={currentPlayerAsPlayer?.user_id}
              onUpdate={handleUpdateAttendance}
              updatingPlayers={updatingPlayers}
              hideHeader
            />
          </CustomTabPanel>
          <CustomTabPanel value={tabValue} index={1}>
            <AttendanceListColumn
              title={t("peladas.attendance.status.pending")}
              count={pending.length}
              players={pending}
              emptyMessage={t("peladas.attendance.empty.pending")}
              isAdmin={isAdmin}
              currentUserId={currentPlayerAsPlayer?.user_id}
              onUpdate={handleUpdateAttendance}
              updatingPlayers={updatingPlayers}
              hideHeader
            />
          </CustomTabPanel>
          <CustomTabPanel value={tabValue} index={2}>
            <AttendanceListColumn
              title={t("peladas.attendance.status.declined")}
              count={declined.length}
              players={declined}
              emptyMessage={t("peladas.attendance.empty.declined")}
              isAdmin={isAdmin}
              currentUserId={currentPlayerAsPlayer?.user_id}
              onUpdate={handleUpdateAttendance}
              updatingPlayers={updatingPlayers}
              hideHeader
            />
          </CustomTabPanel>
        </Box>
      </div>
    </Container>
  );
}
