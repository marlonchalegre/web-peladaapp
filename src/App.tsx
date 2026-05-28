import { useState, useEffect, Suspense } from "react";
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
  CircularProgress,
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
import { initGA, logPageView, logClickEvent } from "./lib/analytics";
import { PWAInstallPrompt } from "./shared/components/PWAInstallPrompt";
import { PullToRefresh } from "./shared/components/PullToRefresh";
import { usePWA } from "./app/providers/PWAContext";
import { PWAProvider } from "./app/providers/PWAProvider";
import { lazyRetry } from "./shared/utils/lazyRetry";

// Lazy load pages to reduce initial bundle size
const LoginPage = lazyRetry(
  () => import("./features/auth/pages/LoginPage"),
  "LoginPage",
);
const RegisterPage = lazyRetry(
  () => import("./features/auth/pages/RegisterPage"),
  "RegisterPage",
);
const FirstAccessPage = lazyRetry(
  () => import("./features/auth/pages/FirstAccessPage"),
  "FirstAccessPage",
);
const ForgotPasswordPage = lazyRetry(
  () => import("./features/auth/pages/ForgotPasswordPage"),
  "ForgotPasswordPage",
);
const ResetPasswordPage = lazyRetry(
  () => import("./features/auth/pages/ResetPasswordPage"),
  "ResetPasswordPage",
);
const HomePage = lazyRetry(
  () => import("./features/home/pages/HomePage"),
  "HomePage",
);
const OrganizationDetailPage = lazyRetry(
  () => import("./features/organizations/pages/OrganizationDetailPage"),
  "OrganizationDetailPage",
);
const JoinOrganizationPage = lazyRetry(
  () => import("./features/organizations/pages/JoinOrganizationPage"),
  "JoinOrganizationPage",
);
const OrganizationStatisticsPage = lazyRetry(
  () => import("./features/organizations/pages/OrganizationStatisticsPage"),
  "OrganizationStatisticsPage",
);
const OrganizationManagementPage = lazyRetry(
  () => import("./features/organizations/pages/OrganizationManagementPage"),
  "OrganizationManagementPage",
);
const PeladaDetailPage = lazyRetry(
  () => import("./features/peladas/pages/PeladaDetailPage"),
  "PeladaDetailPage",
);
const ScheduleBuilderPage = lazyRetry(
  () => import("./features/peladas/pages/ScheduleBuilderPage"),
  "ScheduleBuilderPage",
);
const AttendanceListPage = lazyRetry(
  () => import("./features/peladas/pages/AttendanceListPage"),
  "AttendanceListPage",
);
const PeladaMatchesPage = lazyRetry(
  () => import("./features/peladas/pages/PeladaMatchesPage"),
  "PeladaMatchesPage",
);
const PeladaVotingPage = lazyRetry(
  () => import("./features/peladas/pages/PeladaVotingPage"),
  "PeladaVotingPage",
);
const PeladaVotingResultsPage = lazyRetry(
  () => import("./features/peladas/pages/PeladaVotingResultsPage"),
  "PeladaVotingResultsPage",
);
const UserProfilePage = lazyRetry(
  () => import("./features/user/pages/UserProfilePage"),
  "UserProfilePage",
);
const WelcomePage = lazyRetry(
  () => import("./features/auth/pages/WelcomePage"),
  "WelcomePage",
);
const AdminPanelPage = lazyRetry(
  () => import("./features/admin/pages/AdminPanelPage"),
  "AdminPanelPage",
);

function PageLoading() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
      }}
    >
      <CircularProgress />
    </Box>
  );
}

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
  const [version, setVersion] = useState(
    import.meta.env.VITE_APP_VERSION || "dev",
  );

  useEffect(() => {
    // If it's a dev build, try to get more info from version.json
    const fetchVersion = async () => {
      try {
        const response = await fetch("/version.json?t=" + Date.now(), {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          // Use the generated version if env is 'dev' or missing
          if (
            import.meta.env.VITE_APP_VERSION === "dev" ||
            !import.meta.env.VITE_APP_VERSION
          ) {
            setVersion(data.version);
          }
        }
      } catch (e) {
        console.warn("Could not fetch version.json", e);
      }
    };
    fetchVersion();
  }, []);

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
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
        }}
      >
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
  const { isInstallable, installApp } = usePWA();
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

  const handleInstallApp = () => {
    handleCloseUserMenu();
    installApp();
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
                  alt="Minha Pelada Logo"
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
                  Minha Pelada
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
                      userId={user?.id}
                      filename={
                        user?.avatar_filename ||
                        ((user as unknown as Record<string, unknown>)?.[
                          "avatar-filename"
                        ] as string | undefined)
                      }
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
                    <Typography align="center">
                      {t("navigation.profile")}
                    </Typography>
                  </MenuItem>

                  {user?.is_super_admin && (
                    <MenuItem
                      component={RouterLink}
                      to="/admin"
                      onClick={handleCloseUserMenu}
                      data-testid="admin-menu-item"
                    >
                      <Typography align="center">
                        {t("navigation.adminPanel") || "Admin Panel"}
                      </Typography>
                    </MenuItem>
                  )}

                  {isInstallable && (
                    <MenuItem
                      onClick={handleInstallApp}
                      data-testid="install-app-menu-item"
                    >
                      <Typography align="center">
                        {t("common.install")}
                      </Typography>
                    </MenuItem>
                  )}

                  <MenuItem
                    onClick={handleLogout}
                    data-testid="logout-menu-item"
                  >
                    <Typography align="center">{t("auth.logout")}</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>
        )}
        <Box
          component="main"
          sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
        >
          <PullToRefresh>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                {/* Rotas públicas */}
                <Route path="/" element={<WelcomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/first-access" element={<FirstAccessPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Rotas protegidas */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/home" element={<HomePage />} />
                  <Route
                    path="/join/:token"
                    element={<JoinOrganizationPage />}
                  />
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
                  <Route path="/admin" element={<AdminPanelPage />} />
                </Route>
              </Routes>
            </Suspense>
          </PullToRefresh>
        </Box>
        <Footer /> <PWAInstallPrompt />
      </Box>
    </>
  );
}

export default function App() {
  const { i18n } = useTranslation();
  return (
    <AuthProvider>
      <PWAProvider>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale={i18n.language === "pt-BR" ? "pt-br" : "en"}
        >
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </LocalizationProvider>
      </PWAProvider>
    </AuthProvider>
  );
}
