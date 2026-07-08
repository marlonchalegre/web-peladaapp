import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import { createApi, type Pelada } from "../../../shared/api/endpoints";

const endpoints = createApi(api);

export interface UseAdminPeladasProps {
  showToast: (message: string, severity?: "success" | "error" | "info") => void;
}

export function useAdminPeladas({ showToast }: UseAdminPeladasProps) {
  const { t } = useTranslation();

  // Search & Pagination States - Peladas
  const [peladaPage, setPeladaPage] = useState(1);
  const [peladaTotalPages, setPeladaTotalPages] = useState(1);
  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [peladasLoading, setPeladasLoading] = useState(false);

  // Actions / UI states
  const [deletePeladaTarget, setDeletePeladaTarget] = useState<Pelada | null>(
    null,
  );
  const [deletePeladaLoading, setDeletePeladaLoading] = useState(false);

  // Fetch Peladas
  const fetchPeladas = useCallback(
    async (page: number) => {
      setPeladasLoading(true);
      try {
        const response = await endpoints.listPeladasAdmin(page, 10);
        setPeladas(response.data || []);
        setPeladaTotalPages(response.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch peladas:", err);
        showToast(
          t("admin.errors.fetch_peladas", "Erro ao carregar peladas."),
          "error",
        );
      } finally {
        setPeladasLoading(false);
      }
    },
    [t, showToast],
  );

  const handleOpenDeletePelada = (pelada: Pelada) => {
    setDeletePeladaTarget(pelada);
  };

  const handleConfirmDeletePelada = async () => {
    if (!deletePeladaTarget) return;
    setDeletePeladaLoading(true);
    try {
      await endpoints.deletePeladaAdmin(deletePeladaTarget.id);
      showToast(
        t("admin.success.pelada_deleted", "Pelada excluída com sucesso."),
        "success",
      );
      setDeletePeladaTarget(null);
      // If we deleted the last item on the page, go back a page
      const isLastItemOnPage = peladas.length === 1 && peladaPage > 1;
      const targetPage = isLastItemOnPage ? peladaPage - 1 : peladaPage;
      if (isLastItemOnPage) {
        setPeladaPage(targetPage);
      }
      fetchPeladas(targetPage);
    } catch (err) {
      console.error("Failed to delete pelada:", err);
      showToast(
        t("admin.errors.delete_pelada", "Falha ao excluir a pelada."),
        "error",
      );
    } finally {
      setDeletePeladaLoading(false);
    }
  };

  return {
    peladaPage,
    setPeladaPage,
    peladaTotalPages,
    peladas,
    peladasLoading,
    deletePeladaTarget,
    setDeletePeladaTarget,
    deletePeladaLoading,
    fetchPeladas,
    handleOpenDeletePelada,
    handleConfirmDeletePelada,
  };
}
