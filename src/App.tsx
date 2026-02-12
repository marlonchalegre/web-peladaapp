import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link as RouterLink,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  IconButton,
  Avatar,
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
import ProtectedRoute from "./app/routing/ProtectedRoute";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import FirstAccessPage from "./features/auth/pages/FirstAccessPage";
import HomePage from "./features/home/pages/HomePage";
import OrganizationDetailPage from "./features/organizations/pages/OrganizationDetailPage";
import JoinOrganizationPage from "./features/organizations/pages/JoinOrganizationPage";
import OrganizationStatisticsPage from "./features/organizations/pages/OrganizationStatisticsPage";
import OrganizationManagementPage from "./features/organizations/pages/OrganizationManagementPage";
import PeladaDetailPage from "./features/peladas/pages/PeladaDetailPage";
import AttendanceListPage from "./features/peladas/pages/AttendanceListPage";
import PeladaMatchesPage from "./features/peladas/pages/PeladaMatchesPage";
import PeladaVotingPage from "./features/peladas/pages/PeladaVotingPage";
import UserProfilePage from "./features/user/pages/UserProfilePage";

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
  };

  return (
    <BrowserRouter>
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
                to="/"
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
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 1 }}>
                    <Avatar
                      sx={{
                        bgcolor: "primary.dark",
                        width: 36,
                        height: 36,
                        fontSize: "0.9rem",
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </Avatar>
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
                  >
                    <Typography textAlign="center">
                      {t("navigation.profile")}
                    </Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
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
          <Routes>
            {/* Rotas públicas sem Container para permitir centralização própria */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/first-access" element={<FirstAccessPage />} />

            {/* Rotas protegidas com Container */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/join/:token" element={<JoinOrganizationPage />} />
              <Route
                path="/organizations/:id"
                element={
                  <Container maxWidth="lg" sx={{ py: 3 }}>
                    <OrganizationDetailPage />
                  </Container>
                }
              />
              <Route
                path="/organizations/:id/statistics"
                element={
                  <Container maxWidth="lg" sx={{ py: 3 }}>
                    <OrganizationStatisticsPage />
                  </Container>
                }
              />
              <Route
                path="/organizations/:id/management"
                element={
                  <Container maxWidth="lg" sx={{ py: 3 }}>
                    <OrganizationManagementPage />
                  </Container>
                }
              />
              <Route
                path="/peladas/:id"
                element={
                  <Container maxWidth="lg" sx={{ py: 3 }}>
                    <PeladaDetailPage />
                  </Container>
                }
              />
              <Route
                path="/peladas/:id/attendance"
                element={
                  <Container maxWidth="lg" sx={{ py: 3 }}>
                    <AttendanceListPage />
                  </Container>
                }
              />
              <Route
                path="/peladas/:id/matches"
                element={
                  <Container maxWidth="lg" sx={{ py: 3 }}>
                    <PeladaMatchesPage />
                  </Container>
                }
              />
              <Route
                path="/peladas/:id/voting"
                element={
                  <Container maxWidth="lg" sx={{ py: 3 }}>
                    <PeladaVotingPage />
                  </Container>
                }
              />
              <Route
                path="/profile"
                element={
                  <Container maxWidth="lg" sx={{ py: 3 }}>
                    <UserProfilePage />
                  </Container>
                }
              />
            </Route>
          </Routes>
        </Box>
        <Footer />
      </Box>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
