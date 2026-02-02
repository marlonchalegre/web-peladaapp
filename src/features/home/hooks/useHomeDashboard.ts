import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import { createApi, type Pelada } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";

const endpoints = createApi(api);

export type OrganizationWithRole = {
  id: number;
  name: string;
  role: "admin" | "player";
};

export function useHomeDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [adminOrgs, setAdminOrgs] = useState<OrganizationWithRole[]>([]);
  const [memberOrgs, setMemberOrgs] = useState<OrganizationWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [peladasPage, setPeladasPage] = useState(1);
  const [peladasTotalPages, setPeladasTotalPages] = useState(1);
  const PELADAS_PER_PAGE = 5;

  const fetchPeladas = useCallback(
    async (page: number) => {
      if (!user) return;
      try {
        const response = await endpoints.listPeladasByUser(
          user.id,
          page,
          PELADAS_PER_PAGE,
        );
        setPeladas(response.data);
        setPeladasPage(response.page);
        setPeladasTotalPages(response.totalPages);
      } catch (err) {
        console.error("Failed to fetch peladas", err);
      }
    },
    [user],
  );

  const fetchOrganizations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      const userOrgs = await endpoints.listUserOrganizations(user.id);

      if (!Array.isArray(userOrgs)) {
        throw new Error(t("home.error.invalid_format_org_list"));
      }

      const adminOrgsList = userOrgs.filter((org) => org.role === "admin");
      const memberOrgsList = userOrgs.filter((org) => org.role === "player");

      setAdminOrgs(adminOrgsList);
      setMemberOrgs(memberOrgsList);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("home.error.load_failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchOrganizations();
    fetchPeladas(1);
  }, [fetchOrganizations, fetchPeladas]);

  const handlePeladaPageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    fetchPeladas(value);
  };

  const createOrganization = useCallback(
    async (name: string) => {
      await endpoints.createOrganization(name);
      fetchOrganizations();
    },
    [fetchOrganizations],
  );

  return {
    loading,
    error,
    adminOrgs,
    memberOrgs,
    peladas,
    peladasPage,
    peladasTotalPages,
    fetchOrganizations,
    handlePeladaPageChange,
    createOrganization,
  };
}
