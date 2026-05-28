import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import { createApi, type Organization } from "../../../shared/api/endpoints";

const endpoints = createApi(api);

export interface UseAdminOrganizationsProps {
  showToast: (message: string, severity?: "success" | "error" | "info") => void;
}

export function useAdminOrganizations({
  showToast,
}: UseAdminOrganizationsProps) {
  const { t } = useTranslation();

  // Search & Pagination States - Organizations
  const [orgQuery, setOrgQuery] = useState("");
  const [orgPage, setOrgPage] = useState(1);
  const [orgTotalPages, setOrgTotalPages] = useState(1);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);

  // Actions / UI states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [manageAdminsOrg, setManageAdminsOrg] = useState<Organization | null>(
    null,
  );
  const [deleteOrgTarget, setDeleteOrgTarget] = useState<Organization | null>(
    null,
  );
  const [deleteOrgLoading, setDeleteOrgLoading] = useState(false);

  // Fetch Organizations
  const fetchOrganizations = useCallback(
    async (query: string, page: number) => {
      setOrganizationsLoading(true);
      try {
        const response = await endpoints.listOrganizationsAdmin(
          query,
          page,
          10,
        );
        setOrganizations(response.data || []);
        setOrgTotalPages(response.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
        showToast(
          t("admin.errors.fetch_orgs", "Erro ao carregar organizações."),
          "error",
        );
      } finally {
        setOrganizationsLoading(false);
      }
    },
    [t, showToast],
  );

  // Search submit handler
  const handleOrgSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOrgPage(1);
    fetchOrganizations(orgQuery, 1);
  };

  // Toggle for Organization Block
  const handleToggleOrgBlock = async (org: Organization) => {
    const actionKey = `org-block-${org.id}`;
    setActionInProgress(actionKey);
    try {
      const res = await endpoints.toggleBlockOrganization(org.id);
      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === org.id ? { ...o, is_blocked: res.is_blocked } : o,
        ),
      );
      showToast(
        res.is_blocked
          ? t("admin.success.org_blocked", "Organização bloqueada com sucesso.")
          : t(
              "admin.success.org_unblocked",
              "Organização desbloqueada com sucesso.",
            ),
        "success",
      );
    } catch (err) {
      console.error("Failed to toggle org block:", err);
      showToast(
        t(
          "admin.errors.toggle_org_block",
          "Falha ao alterar estado de bloqueio da organização.",
        ),
        "error",
      );
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenManageAdmins = (org: Organization) => {
    setManageAdminsOrg(org);
  };

  const handleOpenDeleteOrg = (org: Organization) => {
    setDeleteOrgTarget(org);
  };

  const handleConfirmDeleteOrg = async () => {
    if (!deleteOrgTarget) return;
    setDeleteOrgLoading(true);
    try {
      await endpoints.deleteOrganization(deleteOrgTarget.id);
      showToast(
        t("admin.success.org_deleted", "Organização excluída com sucesso."),
        "success",
      );
      setDeleteOrgTarget(null);
      fetchOrganizations(orgQuery, orgPage);
    } catch (err) {
      console.error("Failed to delete organization:", err);
      showToast(
        t("admin.errors.delete_org", "Falha ao excluir a organização."),
        "error",
      );
    } finally {
      setDeleteOrgLoading(false);
    }
  };

  return {
    orgQuery,
    setOrgQuery,
    orgPage,
    setOrgPage,
    orgTotalPages,
    organizations,
    organizationsLoading,
    actionInProgress,
    manageAdminsOrg,
    setManageAdminsOrg,
    deleteOrgTarget,
    setDeleteOrgTarget,
    deleteOrgLoading,
    fetchOrganizations,
    handleOrgSearch,
    handleToggleOrgBlock,
    handleOpenManageAdmins,
    handleOpenDeleteOrg,
    handleConfirmDeleteOrg,
  };
}
