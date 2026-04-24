import { useState, useEffect } from "react";
import { api } from "../../shared/api/client";
import {
  createApi,
  type OrganizationFinance,
} from "../../shared/api/endpoints";

const endpoints = createApi(api);

const cache: Record<number, { data: OrganizationFinance; timestamp: number }> =
  {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useOrganizationFinance(orgId: number | undefined) {
  const [organizationFinance, setOrganizationFinance] =
    useState<OrganizationFinance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!orgId) return;

    const fetchFinance = async () => {
      const cached = cache[orgId];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (isMounted) setOrganizationFinance(cached.data);
        return;
      }

      if (isMounted) setLoading(true);
      if (isMounted) setError(null);
      try {
        const data = await endpoints.getOrganizationFinance(orgId);
        cache[orgId] = { data, timestamp: Date.now() };
        if (isMounted) setOrganizationFinance(data);
      } catch (err) {
        if (isMounted)
          setError(
            err instanceof Error ? err.message : "Failed to load finance",
          );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFinance();
    return () => {
      isMounted = false;
    };
  }, [orgId]);

  return { organizationFinance, loadingFinance: loading, financeError: error };
}
