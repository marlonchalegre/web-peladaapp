import { Box, Button, IconButton, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useTranslation } from "react-i18next";
import type { User, UserProfileDashboard } from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { ThemeSwitcher } from "../../../shared/components/ThemeSwitcher";
import {
  formatRating,
  type ProfileSkillRow,
  type RecentMatchRow,
} from "../utils/profileFormat";
import {
  ProfileGroupCardsList,
  ProfilePresenceCard,
  ProfileRecentMatchesCard,
  ProfileSkillsCard,
} from "./UserProfileWidgets";

type Props = {
  authUser: User | null;
  name: string;
  username: string;
  position: string;
  userInitials: string;
  avatarFilename: string | null;
  dashboard: UserProfileDashboard | null;
  profileSkills: ProfileSkillRow[];
  skillAverage: number | null;
  recentMatches: RecentMatchRow[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onBack: () => void;
};

export default function UserProfileMobileView({
  authUser,
  name,
  username,
  position,
  userInitials,
  avatarFilename,
  dashboard,
  profileSkills,
  skillAverage,
  recentMatches,
  isEditing,
  onToggleEdit,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const presenceWeeks = dashboard?.presence ?? [];

  return (
    <Box sx={{ display: isEditing ? "none" : "block" }}>
      {/* Template 2d: MINHA FICHA Dark Card */}
      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "background.paper" : "grey.900",
          border: (theme) =>
            theme.palette.mode === "dark"
              ? `1.5px solid ${theme.palette.divider}`
              : "none",
          borderRadius: { xs: 0, sm: "18px" },
          p: { xs: 2.5, sm: 3.5 },
          mx: { xs: -1, sm: -2 },
          mt: { xs: -2, sm: -4 },
          mb: 3,
          color: (theme) =>
            theme.palette.mode === "dark"
              ? theme.palette.text.primary
              : theme.palette.grey[100],
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
          }}
        >
          <IconButton
            onClick={onBack}
            sx={{
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.text.secondary
                  : theme.palette.grey[500],
              p: 0.5,
              ml: -0.5,
              "&:hover": {
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.text.primary
                    : theme.palette.grey[100],
              },
            }}
            aria-label="Voltar"
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "9.5px",
              letterSpacing: ".18em",
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.text.secondary
                  : theme.palette.grey[500],
              textTransform: "uppercase",
            }}
          >
            {isEditing ? "EDITAR PERFIL" : "MINHA FICHA"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ThemeSwitcher
              data-testid="profile-theme-toggle"
              iconSize={18}
              sx={{
                border: "none",
                width: "auto",
                height: "auto",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.text.secondary
                    : theme.palette.grey[500],
                p: 0.5,
                "&:hover": {
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.primary
                      : theme.palette.grey[100],
                },
              }}
            />
            <Button
              onClick={onToggleEdit}
              data-testid="edit-profile-button"
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "11px",
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.text.secondary
                    : theme.palette.grey[500],
                textTransform: "none",
                p: 0,
                minWidth: "auto",
                "&:hover": {
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.primary
                      : theme.palette.grey[100],
                  bgcolor: "transparent",
                },
              }}
            >
              {isEditing
                ? t("common.cancel", "Cancelar")
                : t("common.edit", "Editar")}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: isEditing ? "none" : "block" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <SecureAvatar
                userId={authUser?.id}
                filename={avatarFilename || authUser?.avatar_filename}
                fallbackText={userInitials}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "grey.300",
                  border: (theme) =>
                    `3px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[100]}`,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "20px",
                  color: "grey.900",
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography
                  sx={{
                    font: "800 21px/1.1 Archivo,sans-serif",
                    color: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.text.primary
                        : theme.palette.grey[100],
                  }}
                >
                  {name || authUser?.name}
                </Typography>
                <Typography
                  sx={{
                    font: "700 10px/1 Archivo,sans-serif",
                    letterSpacing: ".14em",
                    color: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.text.secondary
                        : theme.palette.grey[500],
                    mt: 0.75,
                  }}
                >
                  @{username || authUser?.username}
                  {position
                    ? ` · ${t(
                        `common.positions.${position.toLowerCase()}`,
                      ).toUpperCase()}`
                    : ""}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Typography
                sx={{
                  font: "700 32px/1 'Archivo Narrow',Archivo,sans-serif",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.primary
                      : theme.palette.grey[100],
                }}
              >
                {formatRating(dashboard?.summary.avg_rating)}
              </Typography>
              <Typography
                sx={{
                  font: "700 8.5px/1 Archivo,sans-serif",
                  letterSpacing: ".1em",
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.secondary
                      : theme.palette.grey[500],
                  mt: 0.5,
                  textTransform: "uppercase",
                }}
              >
                NOTA
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, mt: 2.5, flexWrap: "wrap" }}>
            {(dashboard?.summary.titles ?? 0) > 0 && (
              <Box
                sx={{
                  bgcolor: "gold.main",
                  color: "gold.contrastText",
                  borderRadius: "7px",
                  px: 1.25,
                  py: 0.75,
                  font: "800 9.5px/1 Archivo,sans-serif",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                }}
              >
                {dashboard?.summary.titles} TÍTULOS
              </Box>
            )}
            {(dashboard?.summary.mvp_count ?? 0) > 0 && (
              <Box
                sx={{
                  border: (theme) =>
                    `1.5px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[800]}`,
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.primary
                      : theme.palette.grey[100],
                  borderRadius: "7px",
                  px: 1.25,
                  py: 0.75,
                  font: "800 9.5px/1 Archivo,sans-serif",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                }}
              >
                {dashboard?.summary.mvp_count}× MVP
              </Box>
            )}
            {(dashboard?.summary.garcom_count ?? 0) > 0 && (
              <Box
                sx={{
                  border: (theme) =>
                    `1.5px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[800]}`,
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.text.primary
                      : theme.palette.grey[100],
                  borderRadius: "7px",
                  px: 1.25,
                  py: 0.75,
                  font: "800 9.5px/1 Archivo,sans-serif",
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                }}
              >
                {dashboard?.summary.garcom_count}× GARÇOM
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <ProfileSkillsCard
        skillRows={profileSkills}
        skillAverage={skillAverage}
        variant="mobile"
      />

      <ProfileGroupCardsList
        groups={dashboard?.groups ?? []}
        year={dashboard?.year}
        variant="mobile"
      />

      <ProfilePresenceCard presenceWeeks={presenceWeeks} variant="mobile" />

      <ProfileRecentMatchesCard
        recentMatches={recentMatches}
        variant="mobile"
      />
    </Box>
  );
}
