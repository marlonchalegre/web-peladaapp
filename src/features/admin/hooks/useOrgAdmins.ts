import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type User,
  type OrganizationAdmin,
} from "../../../shared/api/endpoints";

const endpoints = createApi(api);

export interface UseOrgAdminsProps {
  organizationId?: string;
  showToast: (message: string, severity?: "success" | "error" | "info") => void;
}

export function useOrgAdmins({ organizationId, showToast }: UseOrgAdminsProps) {
  const { t } = useTranslation();

  // State Management
  const [admins, setAdmins] = useState<OrganizationAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Current Admins
  const fetchAdmins = useCallback(
    async (orgId: string) => {
      setLoading(true);
      try {
        const res = await endpoints.listAdminsByOrganization(orgId);
        setAdmins(res || []);
      } catch (err) {
        console.error("Failed to fetch org admins:", err);
        showToast(
          t("admin.errors.fetch_admins", "Falha ao carregar administradores."),
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [t, showToast],
  );

  // Load admins when org ID changes
  useEffect(() => {
    if (organizationId) {
      fetchAdmins(organizationId);
      setSearchQuery("");
      setSearchResults([]);
    } else {
      setAdmins([]);
    }
  }, [organizationId, fetchAdmins]);

  // Search users to add as admin
  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await endpoints.searchUsers(searchQuery, 1, 10);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error("Failed to search users:", err);
      showToast(
        t("admin.errors.search_users", "Falha ao buscar usuários."),
        "error",
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // Add organization admin
  const addAdmin = async (userId: string) => {
    if (!organizationId) return;
    setActionLoading(true);
    try {
      await endpoints.addOrganizationAdmin(organizationId, userId);
      showToast(
        t("admin.success.add_admin", "Administrador adicionado com sucesso."),
        "success",
      );
      setSearchQuery("");
      setSearchResults([]);
      await fetchAdmins(organizationId);
    } catch (err) {
      console.error("Failed to add admin:", err);
      showToast(
        t("admin.errors.add_admin", "Falha ao adicionar administrador."),
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Remove organization admin
  const removeAdmin = async (userId: string) => {
    if (!organizationId) return;
    setActionLoading(true);
    try {
      await endpoints.removeOrganizationAdmin(organizationId, userId);
      showToast(
        t("admin.success.remove_admin", "Administrador removido com sucesso."),
        "success",
      );
      await fetchAdmins(organizationId);
    } catch (err) {
      console.error("Failed to remove admin:", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("last administrator")) {
        showToast(
          t(
            "admin.errors.last_admin",
            "A organização deve ter pelo menos um administrador.",
          ),
          "error",
        );
      } else {
        showToast(
          t("admin.errors.remove_admin", "Falha ao remover administrador."),
          "error",
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  return {
    admins,
    loading,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    searchLoading,
    actionLoading,
    fetchAdmins,
    handleSearchUsers,
    addAdmin,
    removeAdmin,
  };
}
