import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../app/providers/AuthContext";
import { useAppTheme } from "../../app/providers/ThemeContext";
import { api } from "../../shared/api/client";
import { createApi, type Organization } from "../../shared/api/endpoints";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

const endpoints = createApi(api);

interface DesktopHeaderProps {
  currentOrgName?: string;
}

export default function DesktopHeader({ currentOrgName }: DesktopHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { mode, toggleTheme } = useAppTheme();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElOrg, setAnchorElOrg] = useState<null | HTMLElement>(null);

  const pathname = location.pathname;
  const isHome = pathname === "/home" || pathname === "/";
  const isGroups = pathname.startsWith("/organizations");
  const isProfile = pathname.startsWith("/profile");

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenOrgMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElOrg(event.currentTarget);
  };

  const handleCloseOrgMenu = () => {
    setAnchorElOrg(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    signOut();
    navigate("/");
  };

  const userInitials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user?.name]);

  const [userOrgs, setUserOrgs] = useState<
    (Organization & { role?: string })[]
  >([]);

  useEffect(() => {
    if (!user?.id) return;
    endpoints
      .listUserOrganizations(user.id)
      .then((orgs) => setUserOrgs(orgs || []))
      .catch((err) =>
        console.error("Failed to load user orgs for header", err),
      );
  }, [user?.id]);

  const activeOrgLabel = useMemo(() => {
    if (currentOrgName) return currentOrgName;
    const orgMatch = pathname.match(/^\/organizations\/([^/]+)/);
    if (orgMatch && orgMatch[1]) {
      const found = userOrgs.find((o) => String(o.id) === String(orgMatch[1]));
      if (found) return found.name;
    }
    if (isGroups) return t("navigation.groups", "Grupos");
    if (userOrgs.length > 0) return userOrgs[0].name;
    return t("home.all_groups", "Todos os grupos");
  }, [currentOrgName, pathname, userOrgs, isGroups, t]);

  return (
    <Box
      component="header"
      sx={{
        bgcolor: "#17181a",
        px: { md: 4, lg: 5 },
        position: "sticky",
        top: 0,
        zIndex: 1100,
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <Box
        sx={{
          maxWidth: 1124,
          mx: "auto",
          display: "flex",
          alignItems: "center",
          gap: { md: 2.5, lg: 3.5 },
          height: 62,
        }}
      >
        {/* Brand Logo */}
        <Box
          component={RouterLink}
          to="/home"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            flexShrink: 0,
            textDecoration: "none",
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "9px",
              bgcolor: "#146b3a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              color: "#ffffff",
            }}
          >
            MP
          </Box>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              lineHeight: 1.1,
              letterSpacing: ".04em",
              color: "#f6f4ee",
            }}
          >
            MINHA PELADA
          </Typography>
        </Box>

        {/* Primary Desktop Nav Links */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1 }}>
          <Box
            component={RouterLink}
            to="/home"
            sx={{
              px: 1.6,
              py: 1.1,
              borderRadius: "10px",
              bgcolor: isHome ? "#242628" : "transparent",
              fontFamily: "Archivo, sans-serif",
              fontWeight: isHome ? 800 : 700,
              fontSize: "12.5px",
              lineHeight: 1,
              color: isHome ? "#f6f4ee" : "#9a958a",
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              "&:hover": {
                color: "#f6f4ee",
                bgcolor: isHome ? "#242628" : "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            {t("navigation.home", "Início")}
          </Box>

          <Box
            component={RouterLink}
            to="/home#meus-grupos"
            onClick={() => {
              const el = document.getElementById("meus-grupos");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            sx={{
              px: 1.6,
              py: 1.1,
              borderRadius: "10px",
              bgcolor: isGroups ? "#242628" : "transparent",
              fontFamily: "Archivo, sans-serif",
              fontWeight: isGroups ? 800 : 700,
              fontSize: "12.5px",
              lineHeight: 1,
              color: isGroups ? "#f6f4ee" : "#9a958a",
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              "&:hover": {
                color: "#f6f4ee",
                bgcolor: isGroups ? "#242628" : "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            {t("navigation.groups", "Grupos")}
          </Box>

          <Box
            component={RouterLink}
            to="/profile"
            sx={{
              px: 1.6,
              py: 1.1,
              borderRadius: "10px",
              bgcolor: isProfile ? "#242628" : "transparent",
              fontFamily: "Archivo, sans-serif",
              fontWeight: isProfile ? 800 : 700,
              fontSize: "12.5px",
              lineHeight: 1,
              color: isProfile ? "#f6f4ee" : "#9a958a",
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              "&:hover": {
                color: "#f6f4ee",
                bgcolor: isProfile ? "#242628" : "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            {t("navigation.myCard", "Minha ficha")}
          </Box>
        </Box>

        {/* Group Selector Pill */}
        <Box
          onClick={handleOpenOrgMenu}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.1,
            border: "1.5px solid #3a3b3e",
            borderRadius: "11px",
            px: 1.25,
            py: 0.75,
            cursor: "pointer",
            flexShrink: 0,
            transition: "border-color 0.15s ease",
            "&:hover": {
              borderColor: "#6b675c",
            },
          }}
        >
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "2px",
              bgcolor: isGroups ? "#146b3a" : "#f2a100",
            }}
          />
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "11.5px",
              lineHeight: 1,
              color: "#f6f4ee",
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {activeOrgLabel}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "11px",
              color: "#9a958a",
            }}
          >
            ▾
          </Typography>
        </Box>

        <Menu
          anchorEl={anchorElOrg}
          open={Boolean(anchorElOrg)}
          onClose={handleCloseOrgMenu}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "#17181a",
                border: "1px solid #3a3b3e",
                color: "#f6f4ee",
                borderRadius: "12px",
                mt: 1,
              },
            },
          }}
        >
          {userOrgs.map((org) => (
            <MenuItem
              key={org.id}
              onClick={() => {
                handleCloseOrgMenu();
                navigate(`/organizations/${org.id}`);
              }}
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                "&:hover": { bgcolor: "#242628" },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "2px",
                  bgcolor: "#146b3a",
                  flexShrink: 0,
                }}
              />
              {org.name}
            </MenuItem>
          ))}
          {userOrgs.length > 0 && (
            <Divider sx={{ my: 0.5, borderColor: "#2e2f31" }} />
          )}
          <MenuItem
            onClick={() => {
              handleCloseOrgMenu();
              navigate("/home");
            }}
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "12px",
              "&:hover": { bgcolor: "#242628" },
            }}
          >
            {t("home.all_groups", "Todos os grupos")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseOrgMenu();
              navigate("/home#meus-grupos");
              const el = document.getElementById("meus-grupos");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "12px",
              "&:hover": { bgcolor: "#242628" },
            }}
          >
            {t("organizations.management.title", "Ver todos os meus grupos")}
          </MenuItem>
        </Menu>

        {/* Action Controls & Avatar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.1,
            flexShrink: 0,
          }}
        >
          {/* Language Switcher Pill */}
          <Box
            onClick={() => {
              const newLang = i18n.language?.startsWith("pt") ? "en" : "pt-BR";
              i18n.changeLanguage(newLang);
            }}
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              border: "1.5px solid #3a3b3e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "11px",
              color: "#9a958a",
              cursor: "pointer",
              transition: "all 0.15s ease",
              "&:hover": {
                color: "#f6f4ee",
                borderColor: "#6b675c",
              },
            }}
          >
            {i18n.language?.startsWith("pt") ? "PT" : "EN"}
          </Box>

          {/* Theme Switcher */}
          <Tooltip
            title={
              mode === "dark" ? t("common.theme.light") : t("common.theme.dark")
            }
          >
            <IconButton
              onClick={toggleTheme}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "10px",
                border: "1.5px solid #3a3b3e",
                color: "#9a958a",
                p: 0,
                "&:hover": {
                  color: "#f6f4ee",
                  borderColor: "#6b675c",
                },
              }}
            >
              {mode === "dark" ? (
                <Brightness7Icon sx={{ fontSize: 16 }} />
              ) : (
                <Brightness4Icon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Tooltip>

          {/* User Avatar */}
          <Box
            onClick={handleOpenUserMenu}
            data-testid="user-settings-button"
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: "#146b3a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "10.5px",
              color: "#ffffff",
              cursor: "pointer",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              transition: "transform 0.15s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            {userInitials}
          </Box>

          <Menu
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            slotProps={{
              paper: {
                sx: {
                  bgcolor: "#17181a",
                  border: "1px solid #3a3b3e",
                  color: "#f6f4ee",
                  borderRadius: "12px",
                  mt: 1,
                },
              },
            }}
          >
            <MenuItem
              component={RouterLink}
              to="/profile"
              onClick={handleCloseUserMenu}
              data-testid="profile-menu-item"
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "12px",
                "&:hover": { bgcolor: "#242628" },
              }}
            >
              {t("navigation.profile", "Minha ficha")}
            </MenuItem>

            {user?.is_super_admin && (
              <MenuItem
                component={RouterLink}
                to="/admin"
                onClick={handleCloseUserMenu}
                data-testid="admin-menu-item"
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "12px",
                  "&:hover": { bgcolor: "#242628" },
                }}
              >
                {t("navigation.adminPanel", "Painel de Administração")}
              </MenuItem>
            )}

            <MenuItem
              onClick={handleLogout}
              data-testid="logout-menu-item"
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "12px",
                color: "#e57373",
                "&:hover": { bgcolor: "#242628" },
              }}
            >
              {t("auth.logout", "Sair")}
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
}
