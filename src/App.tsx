import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link as RouterLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import "./App.css";
import { AuthProvider } from "./app/providers/AuthProvider";
import { useAuth } from "./app/providers/AuthContext";
import { useAppTheme } from "./app/providers/ThemeContext";
import { LanguageSwitcher } from "./shared/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt-br";
import ProtectedRoute from "./app/routing/ProtectedRoute";
import { SecureAvatar } from "./shared/components/SecureAvatar";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import FirstAccessPage from "./features/auth/pages/FirstAccessPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";
import HomePage from "./features/home/pages/HomePage";
import OrganizationDetailPage from "./features/organizations/pages/OrganizationDetailPage";
import JoinOrganizationPage from "./features/organizations/pages/JoinOrganizationPage";
import OrganizationStatisticsPage from "./features/organizations/pages/OrganizationStatisticsPage";
import OrganizationManagementPage from "./features/organizations/pages/OrganizationManagementPage";
import PeladaDetailPage from "./features/peladas/pages/PeladaDetailPage";
import ScheduleBuilderPage from "./features/peladas/pages/ScheduleBuilderPage";
import AttendanceListPage from "./features/peladas/pages/AttendanceListPage";
import PeladaMatchesPage from "./features/peladas/pages/PeladaMatchesPage";
import PeladaVotingPage from "./features/peladas/pages/PeladaVotingPage";
import PeladaVotingResultsPage from "./features/peladas/pages/PeladaVotingResultsPage";
import UserProfilePage from "./features/user/pages/UserProfilePage";
import WelcomePage from "./features/auth/pages/WelcomePage";
import { initGA, logPageView, logClickEvent } from "./lib/analytics";
import { PWAInstallPrompt } from "./shared/components/PWAInstallPrompt";
import { PullToRefresh } from "./shared/components/PullToRefresh";

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initGA();

    const getPageName = (path: string) => {
      const parts = path.split("/").filter(Boolean);
      if (parts.length === 0) return "Home";
      return parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" > ");
    };

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const clickable = target.closest("button, a, [role='button']");

      if (clickable) {
        const analyticsId = clickable.getAttribute("data-analytics-id");
        const elementText =
          clickable.textContent?.trim() ||
          clickable.getAttribute("aria-label") ||
          clickable.getAttribute("title") ||
          "unnamed-element";

        const pageName = getPageName(location.pathname);
        const elementName = analyticsId || clickable.tagName.toLowerCase();

        logClickEvent(pageName, elementName, elementText);
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [location.pathname]);

  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

function Footer() {
  const { t } = useTranslation();
  const version = import.meta.env.VITE_APP_VERSION || t("app.development");

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: "auto",
        backgroundColor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
        textAlign: "center",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {t("app.version", { version })}
      </Typography>
    </Box>
  );
}

function AppLayout() {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useAppTheme();
  const { t } = useTranslation();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    signOut();
    navigate("/");
  };

  return (
    <>
      <AnalyticsTracker />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        {isAuthenticated && (
          <AppBar
            position="static"
            color="inherit"
            elevation={0}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Toolbar>
              <Box
                component={RouterLink}
                to="/home"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                  flexGrow: 1,
                }}
              >
                <Box
                  component="img"
                  src="/logo.png"
                  alt="Pelada App Logo"
                  sx={{ height: 32, mr: 1.5 }}
                />
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    fontSize: "1.125rem",
                  }}
                >
                  PeladaApp
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LanguageSwitcher />
                <IconButton
                  onClick={toggleTheme}
                  sx={{ color: "text.secondary" }}
                >
                  {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>

                <Tooltip title="Open settings">
                  <IconButton
                    onClick={handleOpenUserMenu}
                    sx={{ p: 0, ml: 1 }}
                    data-testid="user-settings-button"
                  >
                    <SecureAvatar
                      userId={user?.id || 0}
                      filename={user?.avatar_filename}
                      sx={{
                        bgcolor: "primary.dark",
                        width: 36,
                        height: 36,
                        fontSize: "0.9rem",
                      }}
                      fallbackText={user?.name?.charAt(0).toUpperCase() || "U"}
                    />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem
                    component={RouterLink}
                    to="/profile"
                    onClick={handleCloseUserMenu}
                    data-testid="profile-menu-item"
                  >
                    <Typography textAlign="center">
                      {t("navigation.profile")}
                    </Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={handleLogout}
                    data-testid="logout-menu-item"
                  >
                    <Typography textAlign="center">
                      {t("auth.logout")}
                    </Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>
        )}
        <Box component="main" sx={{ flexGrow: 1 }}>
          <PullToRefresh>
            <Routes>
              {/* Rotas públicas sem Container para permitir centralização própria */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/first-access" element={<FirstAccessPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Rotas protegidas sem Container global para permitir controle por página */}
              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/join/:token" element={<JoinOrganizationPage />} />
                <Route
                  path="/organizations/:id"
                  element={<OrganizationDetailPage />}
                />
                <Route
                  path="/organizations/:id/statistics"
                  element={<OrganizationStatisticsPage />}
                />
                <Route
                  path="/organizations/:id/management"
                  element={<OrganizationManagementPage />}
                />
                <Route path="/peladas/:id" element={<PeladaDetailPage />} />
                <Route
                  path="/peladas/:id/build-schedule"
                  element={<ScheduleBuilderPage />}
                />
                <Route
                  path="/peladas/:id/attendance"
                  element={<AttendanceListPage />}
                />
                <Route
                  path="/peladas/:id/matches"
                  element={<PeladaMatchesPage />}
                />
                <Route
                  path="/peladas/:id/voting"
                  element={<PeladaVotingPage />}
                />
                <Route
                  path="/peladas/:id/results"
                  element={<PeladaVotingResultsPage />}
                />
                <Route path="/profile" element={<UserProfilePage />} />
              </Route>
            </Routes>
          </PullToRefresh>
        </Box>
        <Footer />
        <PWAInstallPrompt />
      </Box>
    </>
  );
}

export default function App() {
  const { i18n } = useTranslation();
  return (
    <AuthProvider>
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale={i18n.language === "pt-BR" ? "pt-br" : "en"}
      >
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </LocalizationProvider>
    </AuthProvider>
  );
}
