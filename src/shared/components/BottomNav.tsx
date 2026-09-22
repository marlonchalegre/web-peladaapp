import { Box, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

export default function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isHome = currentPath === "/home" || currentPath === "/";
  const isProfile = currentPath.startsWith("/profile");

  return (
    <Box
      component="nav"
      aria-label="Navegação inferior"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: "#ffffff",
        borderTop: "1.5px solid #eae6db",
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
            color: isHome ? "#ffffff" : "#6b675c",
            border: isHome ? "none" : "2px solid #c9c4b6",
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
            color: isHome ? "#17181a" : "#6b675c",
            textTransform: "uppercase",
          }}
        >
          INÍCIO
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
            color: "#6b675c",
            border: "2px solid #c9c4b6",
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
            color: "#6b675c",
            textTransform: "uppercase",
          }}
        >
          GRUPOS
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
            color: isProfile ? "#ffffff" : "#6b675c",
            border: isProfile ? "none" : "2px solid #c9c4b6",
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
            color: isProfile ? "#17181a" : "#6b675c",
            textTransform: "uppercase",
          }}
        >
          PERFIL
        </Typography>
      </Box>
    </Box>
  );
}
