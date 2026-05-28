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
import { type Organization } from "../../../shared/api/endpoints";

export interface ConfirmDeleteOrgDialogProps {
  open: boolean;
  onClose: () => void;
  organization: Organization | null;
  loading: boolean;
  onConfirm: () => void;
}

export function ConfirmDeleteOrgDialog({
  open,
  onClose,
  organization,
  loading,
  onConfirm,
}: ConfirmDeleteOrgDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t("admin.dialogs.delete_org.title", "Remover Organização")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(
            "admin.dialogs.delete_org.description",
            "Tem certeza de que deseja remover permanentemente a organização {{name}}? Esta ação não pode ser desfeita e todas as informações associadas serão excluídas.",
            {
              name: organization?.name,
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
          data-testid="confirm-delete-org-btn"
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
