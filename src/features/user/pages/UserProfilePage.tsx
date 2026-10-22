import { useState, useEffect, useMemo, type FormEvent } from "react";
import { Alert, Snackbar, Box, useTheme, useMediaQuery } from "@mui/material";
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
import { useAuth } from "../../../app/providers/AuthContext";
import { useAppTheme } from "../../../app/providers/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { getLocalizedErrorMessage } from "../../../shared/utils/error-handler";
import UserProfileDesktopView from "../components/UserProfileDesktopView";
import UserProfileMobileView from "../components/UserProfileMobileView";
import UserProfileEditForm from "../components/UserProfileEditForm";
import { getInitials } from "../../../shared/utils/initials";
import {
  toRecentMatchRows,
  buildProfileSkillRows,
  calculateSkillAverage,
} from "../utils/profileFormat";

const endpoints = createApi(api);

export default function UserProfilePage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { mode, toggleTheme } = useAppTheme();
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

    if (file.size > 2 * 1024 * 1024) {
      setError(t("user.profile.error.file_too_large"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await uploadUserAvatar(authUser.id, file);
      setAvatarFilename(result.avatar_filename);

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

  const { profileSkills, skillAverage } = useMemo(() => {
    const rows = buildProfileSkillRows(dashboard?.skills, t);
    return {
      profileSkills: rows,
      skillAverage: calculateSkillAverage(rows),
    };
  }, [dashboard?.skills, t]);

  const recentMatches = useMemo(
    () => toRecentMatchRows(dashboard?.recent_peladas, t),
    [dashboard?.recent_peladas, t],
  );

  if (loadingProfile) {
    return <Loading message={t("common.loading")} />;
  }

  const userInitials = getInitials(name || authUser?.name, "U");

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
        <UserProfileMobileView
          authUser={authUser}
          name={name}
          username={username}
          position={position}
          userInitials={userInitials}
          avatarFilename={avatarFilename}
          dashboard={dashboard}
          profileSkills={profileSkills}
          skillAverage={skillAverage}
          recentMatches={recentMatches}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onBack={() => {
            if (isEditing) {
              setIsEditing(false);
            } else {
              navigate(-1);
            }
          }}
        />
      )}

      <UserProfileEditForm
        isEditing={isEditing}
        userId={authUser?.id || "0"}
        avatarFilename={avatarFilename}
        name={name}
        setName={setName}
        username={username}
        setUsername={setUsername}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        position={position}
        setPosition={setPosition}
        receiveNonMensalistaUpdates={receiveNonMensalistaUpdates}
        setReceiveNonMensalistaUpdates={setReceiveNonMensalistaUpdates}
        darkMode={mode === "dark"}
        onToggleTheme={toggleTheme}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        loading={loading}
        onAvatarUpload={handleAvatarUpload}
        onAvatarDelete={handleAvatarDelete}
        onSubmit={onSubmit}
        onCancel={() => navigate("/home")}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        onConfirmDeleteAccount={handleDeleteAccount}
      />
    </Box>
  );
}
