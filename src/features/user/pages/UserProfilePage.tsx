import { useState, useEffect, type FormEvent } from "react";
import {
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  Snackbar,
  Box,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  FormControlLabel,
  Switch,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { PhotoCamera, Delete as DeleteIcon } from "@mui/icons-material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import {
  updateUserProfile,
  getUser,
  deleteUser,
  uploadUserAvatar,
  deleteUserAvatar,
  api,
  type UserProfileUpdate,
} from "../../../shared/api/client";
import {
  createApi,
  type UserProfileDashboard,
} from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { useAuth } from "../../../app/providers/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { getLocalizedErrorMessage } from "../../../shared/utils/error-handler";
import { PhoneInput } from "../../../shared/components/PhoneInput";
import UserProfileDesktopView from "../components/UserProfileDesktopView";
import { toRecentMatchRows } from "../utils/profileFormat";

const endpoints = createApi(api);

export default function UserProfilePage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();
  const { user: authUser, signIn, signOut, token } = useAuth();
  const [isEditing, setIsEditing] = useState(
    () => new URLSearchParams(window.location.search).get("edit") === "true",
  );
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [receiveNonMensalistaUpdates, setReceiveNonMensalistaUpdates] =
    useState(false);
  const [avatarFilename, setAvatarFilename] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dashboard, setDashboard] = useState<UserProfileDashboard | null>(null);

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }

    let active = true;

    // Load current user data
    const loadUserProfile = async () => {
      try {
        const userData = await getUser(authUser.id);
        if (!active) return;
        setName(userData.name);
        setUsername(userData.username);
        setEmail(userData.email || "");
        setPhone(userData.phone || "");
        setPosition(userData.position || "");
        setReceiveNonMensalistaUpdates(
          !!userData.receive_non_mensalista_updates,
        );
        setAvatarFilename(userData.avatar_filename || null);
      } catch (error) {
        if (!active) return;
        console.error("Failed to load user profile:", error);
        setError(t("user.profile.error.load_failed"));
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    };

    loadUserProfile();

    return () => {
      active = false;
    };
  }, [authUser, navigate, t]);

  useEffect(() => {
    if (!authUser) return;
    let active = true;
    Promise.resolve(
      endpoints.getProfileDashboard(authUser.id, new Date().getFullYear()),
    )
      .then((data) => {
        if (active) setDashboard(data ?? null);
      })
      .catch(() => {
        if (active) setDashboard(null);
      });
    return () => {
      active = false;
    };
  }, [authUser]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    // Check size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError(t("user.profile.error.file_too_large"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await uploadUserAvatar(authUser.id, file);
      setAvatarFilename(result.avatar_filename);

      // Update AuthContext
      signIn(token, { ...authUser, avatar_filename: result.avatar_filename });
      setSuccess(t("user.profile.success.avatar_updated"));
    } catch (err: unknown) {
      setError(
        getLocalizedErrorMessage(err, t, "user.profile.error.upload_failed"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!authUser) return;

    setLoading(true);
    setError(null);
    try {
      await deleteUserAvatar(authUser.id);
      setAvatarFilename(null);

      // Update AuthContext
      signIn(token, { ...authUser, avatar_filename: null });
      setSuccess(t("user.profile.success.avatar_deleted"));
    } catch (err: unknown) {
      setError(
        getLocalizedErrorMessage(err, t, "user.profile.error.delete_failed"),
      );
    } finally {
      setLoading(false);
    }
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // SECURITY: This function always uses authUser.id (the authenticated user's ID)
    // The backend validates that users can only update their own profile

    // Validation
    if (password && password !== confirmPassword) {
      setError(t("user.profile.error.password_mismatch"));
      return;
    }

    if (!name.trim()) {
      setError(t("user.profile.error.name_required"));
      return;
    }

    setLoading(true);
    try {
      if (!authUser) throw new Error(t("user.profile.error.not_authenticated"));

      // Prepare update data - only include fields that should be updated
      const updates: {
        name?: string;
        username?: string;
        email?: string;
        phone?: string;
        password?: string;
        position?: string;
        receive_non_mensalista_updates?: boolean;
      } = {};

      if (name !== authUser.name) updates.name = name;
      if (username !== authUser.username) updates.username = username;
      if (email !== (authUser.email || "")) updates.email = email;
      if (phone !== (authUser.phone || "")) updates.phone = phone;
      if (position !== (authUser.position || ""))
        updates.position = position as UserProfileUpdate["position"];
      if (
        receiveNonMensalistaUpdates !==
        !!authUser.receive_non_mensalista_updates
      )
        updates.receive_non_mensalista_updates = receiveNonMensalistaUpdates;
      if (password) updates.password = password;

      if (Object.keys(updates).length === 0) {
        setError(t("user.profile.error.no_changes"));
        setLoading(false);
        return;
      }

      const updatedUser = await updateUserProfile(authUser.id, updates);

      // Update auth context with new user data
      signIn(token, updatedUser);

      setSuccess(t("user.profile.success.updated"));
      setPassword("");
      setConfirmPassword("");
      setIsEditing(false);
    } catch (error: unknown) {
      setError(
        getLocalizedErrorMessage(error, t, "user.profile.error.update_failed"),
      );
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteAccount = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      await deleteUser(authUser.id);
      signOut();
      navigate("/");
    } catch (error: unknown) {
      setError(
        getLocalizedErrorMessage(error, t, "user.profile.error.delete_failed"),
      );
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loadingProfile) {
    return <Loading message={t("common.loading")} />;
  }

  const userInitials = (name || authUser?.name || "U")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const profileSkills = [
    { label: "PASSE", value: dashboard?.skills.passing },
    { label: "DOMÍNIO", value: dashboard?.skills.ball_control },
    { label: "VELOCIDADE", value: dashboard?.skills.velocity },
    { label: "CHUTE", value: dashboard?.skills.shooting },
    { label: "DRIBLE", value: dashboard?.skills.dribbling },
    { label: "MARCAÇÃO", value: dashboard?.skills.defending },
  ];
  const skillValues = profileSkills
    .map((s) => s.value)
    .filter((v): v is number => v != null);
  const skillAverage = skillValues.length
    ? skillValues.reduce((a, b) => a + b, 0) / skillValues.length
    : null;
  const presenceWeeks = dashboard?.presence ?? [];
  const recentMatches = toRecentMatchRows(dashboard?.recent_peladas);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: isDesktop && !isEditing ? "100%" : 680,
        mx: isDesktop && !isEditing ? 0 : "auto",
        py: isDesktop && !isEditing ? 0 : { xs: 2, sm: 4 },
        px: isDesktop && !isEditing ? 0 : { xs: 1, sm: 2 },
      }}
    >
      <Snackbar
        open={Boolean(success || error)}
        autoHideDuration={4000}
        onClose={() => {
          setSuccess(null);
          setError(null);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ mt: { xs: 1, md: 9 }, px: 2 }}
      >
        <Alert
          severity={error ? "error" : "success"}
          variant="filled"
          onClose={() => {
            setSuccess(null);
            setError(null);
          }}
          data-testid={error ? "profile-error-alert" : "profile-success-alert"}
          sx={{ borderRadius: "14px", maxWidth: 560 }}
        >
          {error || success}
        </Alert>
      </Snackbar>

      {/* Desktop Option 6b View */}
      {isDesktop && !isEditing ? (
        <UserProfileDesktopView
          user={authUser}
          name={name}
          username={username}
          position={position}
          userInitials={userInitials}
          avatarFilename={avatarFilename || authUser?.avatar_filename}
          dashboard={dashboard}
          onEditClick={() => setIsEditing(true)}
        />
      ) : (
        /* Mobile Template 2d View */
        <Box sx={{ display: isEditing ? "none" : "block" }}>
          {/* Template 2d: MINHA FICHA Dark Card */}
          <Box
            sx={{
              bgcolor: "#17181a",
              borderRadius: { xs: 0, sm: "18px" },
              p: { xs: 2.5, sm: 3.5 },
              mx: { xs: -1, sm: -2 },
              mt: { xs: -2, sm: -4 },
              mb: 3,
              color: "#f6f4ee",
            }}
          >
            {/* Top Header Bar: ‹ | MINHA FICHA / EDITAR | Editar/Cancelar */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2.5,
              }}
            >
              <IconButton
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                  } else {
                    navigate(-1);
                  }
                }}
                sx={{
                  color: "#9a958a",
                  p: 0.5,
                  ml: -0.5,
                  "&:hover": { color: "#f6f4ee" },
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
                  color: "#9a958a",
                  textTransform: "uppercase",
                }}
              >
                {isEditing ? "EDITAR PERFIL" : "MINHA FICHA"}
              </Typography>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                data-testid="edit-profile-button"
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "11px",
                  color: "#9a958a",
                  textTransform: "none",
                  p: 0,
                  minWidth: "auto",
                  "&:hover": { color: "#f6f4ee", bgcolor: "transparent" },
                }}
              >
                {isEditing
                  ? t("common.cancel", "Cancelar")
                  : t("common.edit", "Editar")}
              </Button>
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
                      bgcolor: "#d8d2c4",
                      border: "3px solid #f6f4ee",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "20px",
                      color: "#17181a",
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography
                      sx={{
                        font: "800 21px/1.1 Archivo,sans-serif",
                        color: "#f6f4ee",
                      }}
                    >
                      {name || authUser?.name}
                    </Typography>
                    <Typography
                      sx={{
                        font: "700 10px/1 Archivo,sans-serif",
                        letterSpacing: ".14em",
                        color: "#9a958a",
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
                      color: "#f6f4ee",
                    }}
                  >
                    {dashboard?.summary.avg_rating == null
                      ? "—"
                      : dashboard.summary.avg_rating
                          .toFixed(1)
                          .replace(".", ",")}
                  </Typography>
                  <Typography
                    sx={{
                      font: "700 8.5px/1 Archivo,sans-serif",
                      letterSpacing: ".1em",
                      color: "#9a958a",
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
                      bgcolor: "#f2a100",
                      color: "#17181a",
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
                      border: "1.5px solid #3a3b3e",
                      color: "#f6f4ee",
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
                      border: "1.5px solid #3a3b3e",
                      color: "#f6f4ee",
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

          {/* Template 2d: FICHA DE HABILIDADES (omitted when there are no ratings) */}
          {skillValues.length > 0 && (
            <Box
              sx={{
                bgcolor: "#ffffff",
                border: "2px solid #17181a",
                borderRadius: "18px",
                p: 2.5,
                boxShadow: "5px 5px 0 #17181a",
                mb: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  mb: 2,
                }}
              >
                <Typography
                  sx={{
                    font: "700 9.5px/1 Archivo,sans-serif",
                    letterSpacing: ".18em",
                    color: "#6b675c",
                    textTransform: "uppercase",
                  }}
                >
                  FICHA DE HABILIDADES
                </Typography>
                <Typography
                  sx={{
                    font: "700 10.5px/1 Archivo,sans-serif",
                    color: "#6b675c",
                  }}
                >
                  {skillAverage == null
                    ? "sem avaliações"
                    : `média ${skillAverage.toFixed(1).replace(".", ",")}`}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {profileSkills.map((skill) => {
                  const pct = skill.value == null ? 0 : (skill.value / 5) * 100;
                  return (
                    <Box
                      key={skill.label}
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Typography
                        sx={{
                          width: 80,
                          font: "700 10.5px/1 Archivo,sans-serif",
                          letterSpacing: ".04em",
                          color: "#17181a",
                        }}
                      >
                        {skill.label}
                      </Typography>
                      <Box
                        sx={{
                          flex: 1,
                          height: 9,
                          borderRadius: 5,
                          bgcolor: "#eae6db",
                          overflow: "hidden",
                          display: "flex",
                        }}
                      >
                        <Box
                          sx={{
                            width: `${pct}%`,
                            bgcolor:
                              (skill.value ?? 0) < 3 ? "#a8452a" : "#146b3a",
                          }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          width: 24,
                          textAlign: "right",
                          font: "700 11px/1 'Archivo Narrow',Archivo,sans-serif",
                          color: "#17181a",
                        }}
                      >
                        {skill.value == null
                          ? "—"
                          : skill.value.toFixed(1).replace(".", ",")}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Template 2d: POR GRUPO */}
          {(dashboard?.groups ?? []).length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  font: "700 9.5px/1 Archivo,sans-serif",
                  letterSpacing: ".18em",
                  color: "#6b675c",
                  textTransform: "uppercase",
                  mb: 1.5,
                }}
              >
                POR GRUPO · {dashboard?.year ?? new Date().getFullYear()}
              </Typography>

              {(dashboard?.groups ?? []).map((group) => (
                <Box
                  key={group.organization_id}
                  sx={{
                    border: "1.5px solid #eae6db",
                    borderRadius: "16px",
                    overflow: "hidden",
                    bgcolor: "#ffffff",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: "11px 14px",
                      bgcolor: "#f4f8f5",
                      borderBottom: "1.5px solid #eae6db",
                    }}
                  >
                    <Box
                      sx={{
                        width: 9,
                        height: 9,
                        borderRadius: "2px",
                        bgcolor: "#146b3a",
                      }}
                    />
                    <Typography
                      sx={{
                        font: "800 11px/1 Archivo,sans-serif",
                        color: "#17181a",
                      }}
                    >
                      {group.organization_name}
                    </Typography>
                    <Typography
                      sx={{
                        font: "700 9.5px/1 Archivo,sans-serif",
                        letterSpacing: ".1em",
                        color: "#6b675c",
                        textTransform: "uppercase",
                      }}
                    >
                      FUTEBOL
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "1px",
                      bgcolor: "#eae6db",
                    }}
                  >
                    {[
                      {
                        label: "JOGOS",
                        val: group.peladas_played,
                        color: "#17181a",
                      },
                      { label: "GOLS", val: group.goals, color: "#17181a" },
                      {
                        label: "ASSIST.",
                        val: group.assists,
                        color: "#146b3a",
                      },
                      { label: "TÍTULOS", val: group.titles, color: "#17181a" },
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{ bgcolor: "#ffffff", p: "12px 9px" }}
                      >
                        <Typography
                          sx={{
                            font: "700 23px/1 'Archivo Narrow',Archivo,sans-serif",
                            color: item.color,
                          }}
                        >
                          {item.val}
                        </Typography>
                        <Typography
                          sx={{
                            font: "700 8px/1.2 Archivo,sans-serif",
                            letterSpacing: ".08em",
                            color: "#6b675c",
                            mt: 0.5,
                          }}
                        >
                          {item.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Template 2d: PRESENÇA ÚLTIMAS 12 SEMANAS */}
          <Box
            sx={{
              bgcolor: "#ffffff",
              border: "1.5px solid #eae6db",
              borderRadius: "16px",
              p: 2.5,
              mb: 3,
            }}
          >
            <Typography
              sx={{
                font: "700 9.5px/1 Archivo,sans-serif",
                letterSpacing: ".18em",
                color: "#6b675c",
                textTransform: "uppercase",
                mb: 2,
              }}
            >
              PRESENÇA · ÚLTIMAS 12 SEMANAS
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: "6px",
                alignItems: "flex-end",
                height: 40,
              }}
            >
              {presenceWeeks.map((week, i) => {
                const barColor =
                  week.status === "present"
                    ? "#146b3a"
                    : week.status === "absent"
                      ? "#a8452a"
                      : "#eae6db";
                return (
                  <Box
                    key={i}
                    sx={{
                      flex: 1,
                      height: week.status === "no_game" ? 14 : 34,
                      borderRadius: "4px",
                      bgcolor: barColor,
                    }}
                  />
                );
              })}
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "2px",
                    bgcolor: "#146b3a",
                  }}
                />
                <Typography
                  sx={{
                    font: "600 10.5px/1 Archivo,sans-serif",
                    color: "#6b675c",
                  }}
                >
                  presente
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "2px",
                    bgcolor: "#a8452a",
                  }}
                />
                <Typography
                  sx={{
                    font: "600 10.5px/1 Archivo,sans-serif",
                    color: "#6b675c",
                  }}
                >
                  faltou
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "2px",
                    bgcolor: "#eae6db",
                  }}
                />
                <Typography
                  sx={{
                    font: "600 10.5px/1 Archivo,sans-serif",
                    color: "#6b675c",
                  }}
                >
                  sem jogo
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Template 2d: ÚLTIMAS PELADAS */}
          {recentMatches.length > 0 && (
            <Box
              sx={{
                bgcolor: "#ffffff",
                border: "1.5px solid #eae6db",
                borderRadius: "16px",
                overflow: "hidden",
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  font: "700 9.5px/1 Archivo,sans-serif",
                  letterSpacing: ".16em",
                  color: "#6b675c",
                  textTransform: "uppercase",
                  p: "14px 16px 10px",
                }}
              >
                ÚLTIMAS PELADAS
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {recentMatches.map((match, mIdx) => (
                  <Box
                    key={mIdx}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: "12px 16px",
                      borderTop: "1.5px solid #f2efe7",
                    }}
                  >
                    <Box sx={{ width: 56, flexShrink: 0 }}>
                      <Typography
                        sx={{
                          font: "700 13px/1 'Archivo Narrow',Archivo,sans-serif",
                          color: "#17181a",
                        }}
                      >
                        {match.date}
                      </Typography>
                      <Typography
                        sx={{
                          font: "600 9px/1 Archivo,sans-serif",
                          color: "#6b675c",
                          mt: 0.5,
                        }}
                      >
                        {match.group}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          font: "700 11.5px/1.3 Archivo,sans-serif",
                          color: "#17181a",
                        }}
                      >
                        {match.desc}
                      </Typography>
                      {match.sub && (
                        <Typography
                          sx={{
                            font: "600 10px/1.3 Archivo,sans-serif",
                            color: "#6b675c",
                            mt: 0.25,
                          }}
                        >
                          {match.sub}
                        </Typography>
                      )}
                    </Box>
                    {match.badge && (
                      <Box
                        sx={{
                          font: "800 8.5px/1 Archivo,sans-serif",
                          letterSpacing: ".06em",
                          color: "#17181a",
                          bgcolor: "#f2a100",
                          borderRadius: "6px",
                          px: 0.8,
                          py: 0.5,
                          flexShrink: 0,
                        }}
                      >
                        {match.badge}
                      </Box>
                    )}
                    <Typography
                      sx={{
                        width: 30,
                        flexShrink: 0,
                        textAlign: "right",
                        font: "700 16px/1 'Archivo Narrow',Archivo,sans-serif",
                        color: "#17181a",
                      }}
                    >
                      {match.score}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Edit Profile Details Form */}
      <Box sx={{ display: isEditing ? "block" : "none" }}>
        <Paper
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: "18px",
            border: "1.5px solid #eae6db",
          }}
        >
          <Box sx={{ px: { xs: 0.5, sm: 0 } }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
              {t("user.profile.title")}
            </Typography>
            <Typography
              variant="body2"
              gutterBottom
              sx={{
                color: "text.secondary",
              }}
            >
              {t("user.profile.subtitle")}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              mb: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                color: "text.secondary",
                alignSelf: "flex-start",
                mb: 2,
              }}
            >
              {t("user.profile.section.change_avatar")}
            </Typography>

            <Box sx={{ position: "relative", display: "inline-block" }}>
              <SecureAvatar
                userId={authUser?.id || "0"}
                filename={avatarFilename}
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: "2rem",
                  bgcolor: "primary.main",
                  border: "2px solid",
                  borderColor: "divider",
                }}
                fallbackText={name.charAt(0).toUpperCase()}
              />

              <Box
                sx={{
                  position: "absolute",
                  bottom: -10,
                  right: -10,
                  display: "flex",
                  gap: 0.5,
                }}
              >
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  disabled={loading}
                  sx={{
                    bgcolor: "background.paper",
                    boxShadow: 2,
                    "&:hover": { bgcolor: "grey.100" },
                  }}
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleAvatarUpload}
                  />
                  <PhotoCamera />
                </IconButton>

                {avatarFilename && (
                  <IconButton
                    color="error"
                    aria-label="delete picture"
                    disabled={loading}
                    onClick={handleAvatarDelete}
                    sx={{
                      bgcolor: "background.paper",
                      boxShadow: 2,
                      "&:hover": { bgcolor: "grey.100" },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <form onSubmit={onSubmit}>
            <Stack spacing={3}>
              <TextField
                id="name"
                label={t("common.fields.name")}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                disabled={loading}
                slotProps={{
                  htmlInput: { "data-testid": "profile-name" },
                }}
              />

              <TextField
                id="username"
                label={t("common.fields.username")}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
                disabled={loading}
                slotProps={{
                  htmlInput: { "data-testid": "profile-username" },
                }}
              />

              <TextField
                id="email"
                label={t("common.fields.email")}
                type="text"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                disabled={loading}
                slotProps={{
                  htmlInput: { "data-testid": "profile-email" },
                }}
              />

              <PhoneInput
                id="phone"
                label={t("common.fields.phone")}
                value={phone}
                onChange={(val) => setPhone(val)}
                fullWidth
                disabled={loading}
                data-testid="profile-phone"
              />

              <FormControl fullWidth disabled={loading}>
                <InputLabel id="position-select-label">
                  {t("common.fields.position")}
                </InputLabel>
                <Select
                  labelId="position-select-label"
                  id="position-select"
                  value={position}
                  label={t("common.fields.position")}
                  onChange={(e) => setPosition(e.target.value)}
                  autoComplete="organization-title"
                  data-testid="profile-position-select"
                >
                  <MenuItem value="">
                    <em>{t("common.select_placeholder")}</em>
                  </MenuItem>
                  <MenuItem
                    value="Striker"
                    data-testid="position-option-Striker"
                  >
                    {t("common.positions.striker")}
                  </MenuItem>
                  <MenuItem
                    value="Midfielder"
                    data-testid="position-option-Midfielder"
                  >
                    {t("common.positions.midfielder")}
                  </MenuItem>
                  <MenuItem
                    value="Defender"
                    data-testid="position-option-Defender"
                  >
                    {t("common.positions.defender")}
                  </MenuItem>
                  <MenuItem
                    value="Goalkeeper"
                    data-testid="position-option-Goalkeeper"
                  >
                    {t("common.positions.goalkeeper")}
                  </MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mt: 1, mb: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={receiveNonMensalistaUpdates}
                      onChange={(e) =>
                        setReceiveNonMensalistaUpdates(e.target.checked)
                      }
                      name="receiveNonMensalistaUpdates"
                      disabled={loading}
                      slotProps={{
                        input: {
                          "data-testid":
                            "receive-non-mensalista-updates-switch",
                        } as React.InputHTMLAttributes<HTMLInputElement>,
                      }}
                    />
                  }
                  label={t("user.profile.field.receive_non_mensalista_updates")}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", ml: 4, mt: -0.5 }}
                >
                  {t(
                    "user.profile.field.receive_non_mensalista_updates_description",
                  )}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  {t("user.profile.section.change_password")}
                </Typography>
              </Divider>

              <TextField
                id="new-password"
                label={t("user.profile.field.new_password")}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                disabled={loading}
                helperText={t("user.profile.hint.password")}
                slotProps={{
                  htmlInput: { "data-testid": "profile-new-password" },
                }}
              />

              <TextField
                id="confirm-password"
                label={t("user.profile.field.confirm_password")}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                disabled={loading || !password}
                slotProps={{
                  htmlInput: { "data-testid": "profile-confirm-password" },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate("/home")}
                  disabled={loading}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  data-testid="profile-save-button"
                >
                  {loading
                    ? t("user.profile.button.saving")
                    : t("user.profile.button.save")}
                </Button>
              </Box>
            </Stack>
          </form>

          <Divider sx={{ my: 4 }} />

          <Typography
            variant="caption"
            color="error"
            sx={{ display: "block", mb: 2 }}
          >
            {t("user.profile.section.danger_zone")}
          </Typography>

          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={loading}
            fullWidth
            data-testid="profile-delete-account-button"
          >
            {t("user.profile.button.delete_account")}
          </Button>
        </Paper>
      </Box>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-account-dialog-title"
        aria-describedby="delete-account-dialog-description"
      >
        <DialogTitle id="delete-account-dialog-title">
          {t("user.profile.dialog.delete_title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-account-dialog-description">
            {t("user.profile.dialog.delete_confirm")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} autoFocus>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            data-testid="confirm-delete-account-button"
          >
            {t("user.profile.dialog.delete_button")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
