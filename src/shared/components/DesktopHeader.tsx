import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../app/providers/AuthContext";
import { api } from "../../shared/api/client";
import { createApi, type Organization } from "../../shared/api/endpoints";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { SecureAvatar } from "./SecureAvatar";

const endpoints = createApi(api);

interface DesktopHeaderProps {
  currentOrgName?: string;
}

export default function DesktopHeader({ currentOrgName }: DesktopHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

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
        bgcolor: "background.paper",
        px: { md: 4, lg: 5 },
        position: "sticky",
        top: 0,
        zIndex: 1100,
        borderBottom: "1px solid",
        borderColor: "divider",
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
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              color: "primary.contrastText",
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
              color: "text.primary",
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
              bgcolor: isHome ? "action.selected" : "transparent",
              fontFamily: "Archivo, sans-serif",
              fontWeight: isHome ? 800 : 700,
              fontSize: "12.5px",
              lineHeight: 1,
              color: isHome ? "text.primary" : "text.secondary",
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              "&:hover": {
                color: "text.primary",
                bgcolor: isHome ? "action.selected" : "action.hover",
              },
            }}
          >
            {t("navigation.home", "Início")}
          </Box>

          <Box
            component={RouterLink}
            to="/profile"
            sx={{
              px: 1.6,
              py: 1.1,
              borderRadius: "10px",
              bgcolor: isProfile ? "action.selected" : "transparent",
              fontFamily: "Archivo, sans-serif",
              fontWeight: isProfile ? 800 : 700,
              fontSize: "12.5px",
              lineHeight: 1,
              color: isProfile ? "text.primary" : "text.secondary",
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              "&:hover": {
                color: "text.primary",
                bgcolor: isProfile ? "action.selected" : "action.hover",
              },
            }}
          >
            {t("navigation.myCard", "Minha ficha")}
          </Box>
        </Box>

        {/* Group Selector Pill */}
        <Box
          component="button"
          type="button"
          onClick={handleOpenOrgMenu}
          aria-haspopup="true"
          aria-expanded={Boolean(anchorElOrg)}
          aria-label={t("navigation.selectGroup", "Selecionar grupo")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.1,
            border: (theme) => `1.5px solid ${theme.palette.divider}`,
            borderRadius: "11px",
            px: 1.25,
            py: 0.75,
            bgcolor: "transparent",
            cursor: "pointer",
            flexShrink: 0,
            outline: "none",
            transition: "border-color 0.15s ease",
            "&:hover": {
              borderColor: "text.secondary",
              bgcolor: "action.hover",
            },
            "&:focus-visible": {
              borderColor: "primary.main",
              boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.light}`,
            },
          }}
        >
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "2px",
              bgcolor: isGroups ? "primary.main" : "gold.main",
            }}
          />
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "11.5px",
              lineHeight: 1,
              color: "text.primary",
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
              color: "text.secondary",
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
                bgcolor: "background.paper",
                border: (theme) => `1px solid ${theme.palette.divider}`,
                color: "text.primary",
                borderRadius: "12px",
                mt: 1,
                minWidth: 220,
                maxHeight: 360,
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
                fontSize: "13px",
                px: 2,
                py: 1.25,
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "2px",
                  bgcolor: "primary.main",
                  flexShrink: 0,
                }}
              />
              {org.name}
            </MenuItem>
          ))}
          {userOrgs.length > 0 && (
            <Divider sx={{ my: 0.5, borderColor: "divider" }} />
          )}
          <MenuItem
            onClick={() => {
              handleCloseOrgMenu();
              navigate("/home");
            }}
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "13px",
              px: 2,
              py: 1.25,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            {t("home.all_groups", "Todos os grupos")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleCloseOrgMenu();
              navigate("/home#meus-grupos");
            }}
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "13px",
              px: 2,
              py: 1.25,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            {t("navigation.myGroups", "Ver todos os meus grupos")}
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
            component="button"
            type="button"
            aria-label={t("navigation.switchLanguage", "Alternar idioma")}
            onClick={() => {
              const newLang = i18n.language?.startsWith("pt") ? "en" : "pt-BR";
              i18n.changeLanguage(newLang);
            }}
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              border: (theme) => `1.5px solid ${theme.palette.divider}`,
              bgcolor: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "11px",
              color: "text.secondary",
              cursor: "pointer",
              outline: "none",
              transition: "all 0.15s ease",
              "&:hover": {
                color: "text.primary",
                borderColor: "text.secondary",
                bgcolor: "action.hover",
              },
              "&:focus-visible": {
                borderColor: "primary.main",
                boxShadow: (theme) =>
                  `0 0 0 2px ${theme.palette.primary.light}`,
              },
            }}
          >
            {i18n.language?.startsWith("pt") ? "PT" : "EN"}
          </Box>

          {/* Theme Switcher */}
          <ThemeSwitcher />

          <IconButton
            onClick={handleOpenUserMenu}
            aria-haspopup="true"
            aria-expanded={Boolean(anchorElUser)}
            aria-label={t("navigation.userMenu", "Menu do usuário")}
            data-testid="user-settings-button"
            sx={{
              p: 0,
              transition: "transform 0.15s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
              "&:focus-visible": {
                boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
              },
            }}
          >
            <SecureAvatar
              userId={user?.id}
              filename={user?.avatar_filename}
              fallbackText={userInitials}
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
                border: (theme) => `2px solid ${theme.palette.divider}`,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "10.5px",
                color: "primary.contrastText",
              }}
            />
          </IconButton>

          <Menu
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            slotProps={{
              paper: {
                sx: {
                  bgcolor: "background.paper",
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  color: "text.primary",
                  borderRadius: "12px",
                  mt: 1,
                  minWidth: 220,
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
                fontSize: "13px",
                px: 2,
                py: 1.25,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {t("navigation.profile", "Perfil")}
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
                  fontSize: "13px",
                  px: 2,
                  py: 1.25,
                  "&:hover": { bgcolor: "action.hover" },
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
                fontSize: "13px",
                px: 2,
                py: 1.25,
                color: "error.main",
                "&:hover": { bgcolor: "action.hover" },
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
