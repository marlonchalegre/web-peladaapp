import { Box, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const currentPath = location.pathname;

  const isHome = currentPath === "/home" || currentPath === "/";
  const isProfile = currentPath.startsWith("/profile");

  return (
    <Box
      component="nav"
      aria-label={t("navigation.navLabel", "Navegação inferior")}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: "background.paper",
        borderTop: "1.5px solid",
        borderColor: "divider",
        py: 1,
        px: 2,
        display: { xs: "flex", md: "none" },
        zIndex: 1100,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.03)",
        maxWidth: 700,
        mx: "auto",
      }}
    >
      {/* INÍCIO */}
      <Box
        component={RouterLink}
        to="/home"
        data-testid="bottom-nav-home"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "7px",
            bgcolor: isHome ? "#146b3a" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isHome ? "#ffffff" : "text.secondary",
            border: isHome ? "none" : "2px solid",
            borderColor: "divider",
          }}
        >
          <HomeRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: isHome ? 800 : 700,
            fontSize: "9.5px",
            letterSpacing: "0.06em",
            color: isHome ? "text.primary" : "text.secondary",
            textTransform: "uppercase",
          }}
        >
          {t("navigation.home_short", "INÍCIO")}
        </Typography>
      </Box>

      {/* GRUPOS */}
      <Box
        component={RouterLink}
        to="/home#meus-grupos"
        data-testid="bottom-nav-groups"
        onClick={() => {
          const el = document.getElementById("meus-grupos");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "7px",
            bgcolor: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
            border: "2px solid",
            borderColor: "divider",
          }}
        >
          <GroupsRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "9.5px",
            letterSpacing: "0.06em",
            color: "text.secondary",
            textTransform: "uppercase",
          }}
        >
          {t("navigation.groups_short", "GRUPOS")}
        </Typography>
      </Box>

      {/* PERFIL */}
      <Box
        component={RouterLink}
        to="/profile"
        data-testid="bottom-nav-profile"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: isProfile ? "#146b3a" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isProfile ? "#ffffff" : "text.secondary",
            border: isProfile ? "none" : "2px solid",
            borderColor: "divider",
          }}
        >
          <PersonRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: isProfile ? 800 : 700,
            fontSize: "9.5px",
            letterSpacing: "0.06em",
            color: isProfile ? "text.primary" : "text.secondary",
            textTransform: "uppercase",
          }}
        >
          {t("navigation.profile_short", "PERFIL")}
        </Typography>
      </Box>
    </Box>
  );
}
