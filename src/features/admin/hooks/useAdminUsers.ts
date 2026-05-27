import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import { createApi, type User } from "../../../shared/api/endpoints";

const endpoints = createApi(api);

export interface UseAdminUsersProps {
  showToast: (message: string, severity?: "success" | "error" | "info") => void;
  currentUser?: { id: string } | null;
}

export function useAdminUsers({ showToast, currentUser }: UseAdminUsersProps) {
  const { t } = useTranslation();

  // Search & Pagination States
  const [userQuery, setUserQuery] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Action states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Password Reset Dialog States
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // Delete User Dialog States
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);

  // Fetch Users
  const fetchUsers = useCallback(
    async (query: string, page: number) => {
      setUsersLoading(true);
      try {
        const response = await endpoints.searchUsers(query, page, 10);
        setUsers(response.data || []);
        setUserTotalPages(response.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        showToast(
          t("admin.errors.fetch_users", "Erro ao carregar usuários."),
          "error",
        );
      } finally {
        setUsersLoading(false);
      }
    },
    [t, showToast],
  );

  // Search Submit Handler
  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    fetchUsers(userQuery, 1);
  };

  // Toggles for User Flags
  const handleToggleUserBlock = async (user: User) => {
    const actionKey = `block-${user.id}`;
    setActionInProgress(actionKey);
    try {
      const res = await endpoints.toggleBlockUser(user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_blocked: res.is_blocked } : u,
        ),
      );
      showToast(
        res.is_blocked
          ? t("admin.success.user_blocked", "Usuário bloqueado com sucesso.")
          : t(
              "admin.success.user_unblocked",
              "Usuário desbloqueado com sucesso.",
            ),
        "success",
      );
    } catch (err) {
      console.error("Failed to toggle user block:", err);
      showToast(
        t("admin.errors.toggle_block", "Falha ao alterar estado de bloqueio."),
        "error",
      );
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleUserOrgCreation = async (user: User) => {
    const actionKey = `org-creation-${user.id}`;
    setActionInProgress(actionKey);
    try {
      const res = await endpoints.toggleOrgCreation(user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, allow_org_creation: res.allow_org_creation }
            : u,
        ),
      );
      showToast(
        res.allow_org_creation
          ? t(
              "admin.success.org_creation_allowed",
              "Criação de organização permitida.",
            )
          : t(
              "admin.success.org_creation_disallowed",
              "Criação de organização restrita.",
            ),
        "success",
      );
    } catch (err) {
      console.error("Failed to toggle user org creation:", err);
      showToast(
        t(
          "admin.errors.toggle_org_creation",
          "Falha ao alterar permissão de criação.",
        ),
        "error",
      );
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleUserSuperAdmin = async (user: User) => {
    if (user.id === currentUser?.id) {
      showToast(
        t(
          "admin.warnings.cannot_demote_self",
          "Você não pode remover seu próprio privilégio de Super Admin.",
        ),
        "info",
      );
      return;
    }
    const actionKey = `super-admin-${user.id}`;
    setActionInProgress(actionKey);
    try {
      const res = await endpoints.toggleSuperAdmin(user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_super_admin: res.is_super_admin } : u,
        ),
      );
      showToast(
        res.is_super_admin
          ? t(
              "admin.success.super_admin_granted",
              "Privilégios de Super Admin concedidos.",
            )
          : t(
              "admin.success.super_admin_revoked",
              "Privilégios de Super Admin revogados.",
            ),
        "success",
      );
    } catch (err) {
      console.error("Failed to toggle user super admin status:", err);
      showToast(
        t(
          "admin.errors.toggle_super_admin",
          "Falha ao alterar status de Super Admin.",
        ),
        "error",
      );
    } finally {
      setActionInProgress(null);
    }
  };

  // Handlers for Password Reset
  const handleOpenResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setResetPasswordValue("");
    setResetPasswordError("");
  };

  const handleConfirmResetPassword = async () => {
    if (!resetPasswordUser) return;
    if (resetPasswordValue.length < 4) {
      setResetPasswordError(
        t("admin.errors.password_too_short", "A senha deve ter pelo menos 4 caracteres."),
      );
      return;
    }
    setResetPasswordLoading(true);
    try {
      await endpoints.resetUserPassword(resetPasswordUser.id, resetPasswordValue);
      showToast(
        t("admin.success.reset_password", "Senha redefinida com sucesso."),
        "success",
      );
      setResetPasswordUser(null);
    } catch (err) {
      console.error("Failed to reset password:", err);
      showToast(
        t("admin.errors.reset_password", "Falha ao redefinir a senha."),
        "error",
      );
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Handlers for User Deletion
  const handleOpenDeleteUser = (user: User) => {
    setDeleteUserTarget(user);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    setDeleteUserLoading(true);
    try {
      await endpoints.deleteUser(deleteUserTarget.id);
      showToast(
        t("admin.success.remove_user", "Usuário removido com sucesso."),
        "success",
      );
      setDeleteUserTarget(null);
      fetchUsers(userQuery, userPage);
    } catch (err) {
      console.error("Failed to delete user:", err);
      showToast(
        t("admin.errors.remove_user", "Falha ao remover o usuário."),
        "error",
      );
    } finally {
      setDeleteUserLoading(false);
    }
  };

  return {
    userQuery,
    setUserQuery,
    userPage,
    setUserPage,
    userTotalPages,
    users,
    usersLoading,
    actionInProgress,
    resetPasswordUser,
    setResetPasswordUser,
    resetPasswordValue,
    setResetPasswordValue,
    resetPasswordError,
    setResetPasswordError,
    resetPasswordLoading,
    deleteUserTarget,
    setDeleteUserTarget,
    deleteUserLoading,
    fetchUsers,
    handleUserSearch,
    handleToggleUserBlock,
    handleToggleUserOrgCreation,
    handleToggleUserSuperAdmin,
    handleOpenResetPassword,
    handleConfirmResetPassword,
    handleOpenDeleteUser,
    handleConfirmDeleteUser,
  };
}
