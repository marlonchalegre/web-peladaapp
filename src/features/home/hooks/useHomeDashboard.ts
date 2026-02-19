import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Pelada,
  type OrganizationInvitation,
} from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";

const endpoints = createApi(api);

export type OrganizationWithRole = {
  id: number;
  name: string;
  role: "admin" | "player";
};

export function useHomeDashboard() {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();

  const [adminOrgs, setAdminOrgs] = useState<OrganizationWithRole[]>([]);
  const [memberOrgs, setMemberOrgs] = useState<OrganizationWithRole[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    OrganizationInvitation[]
  >([]);
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

  const fetchPendingInvitations = useCallback(async () => {
    if (!user) return;
    try {
      const invites = await endpoints.listPendingInvitations();
      setPendingInvitations(invites);
    } catch (err) {
      console.error("Failed to fetch pending invitations", err);
    }
  }, [user]);

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

      // Update local user object if it's missing the new org in admin_orgs
      // This is a local backup if refreshUser didn't update the context fast enough
      if (user && adminOrgsList.length > (user.admin_orgs?.length || 0)) {
        user.admin_orgs = adminOrgsList.map((o) => o.id);
      }
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
    fetchPendingInvitations();
  }, [fetchOrganizations, fetchPeladas, fetchPendingInvitations]);

  const handlePeladaPageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    fetchPeladas(value);
  };

  const acceptInvitation = useCallback(
    async (token: string) => {
      try {
        await endpoints.acceptInvitation(token);
        await fetchPendingInvitations();
        await fetchOrganizations();
      } catch (err) {
        console.error("Failed to accept invitation", err);
      }
    },
    [fetchPendingInvitations, fetchOrganizations],
  );

  const createOrganization = useCallback(
    async (name: string) => {
      await endpoints.createOrganization(name);
      await refreshUser();
      fetchOrganizations();
    },
    [fetchOrganizations, refreshUser],
  );

  return {
    loading,
    error,
    adminOrgs,
    memberOrgs,
    pendingInvitations,
    peladas,
    peladasPage,
    peladasTotalPages,
    fetchOrganizations,
    handlePeladaPageChange,
    acceptInvitation,
    createOrganization,
  };
}
