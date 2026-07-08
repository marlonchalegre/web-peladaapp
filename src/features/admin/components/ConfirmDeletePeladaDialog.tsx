import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { type Pelada } from "../../../shared/api/endpoints";

export interface ConfirmDeletePeladaDialogProps {
  open: boolean;
  onClose: () => void;
  pelada: Pelada | null;
  loading: boolean;
  onConfirm: () => void;
}

export function ConfirmDeletePeladaDialog({
  open,
  onClose,
  pelada,
  loading,
  onConfirm,
}: ConfirmDeletePeladaDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t("admin.dialogs.delete_pelada.title", "Remover Pelada")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(
            "admin.dialogs.delete_pelada.description",
            "Tem certeza de que deseja remover permanentemente a pelada agendada para {{date}} da organização {{orgName}}? Esta ação excluirá todos os times, estatísticas, partidas, votos, lembretes e presenças associados. Esta ação não pode ser desfeita.",
            {
              date: pelada?.scheduled_at
                ? new Date(pelada.scheduled_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-",
              orgName: pelada?.organization_name || "-",
            },
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t("common.cancel", "Cancelar")}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          data-testid="confirm-delete-pelada-btn"
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            t("common.delete", "Excluir")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
