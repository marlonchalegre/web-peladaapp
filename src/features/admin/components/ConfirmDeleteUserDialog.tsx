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
import { type User } from "../../../shared/api/endpoints";

export interface ConfirmDeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  loading: boolean;
  onConfirm: () => void;
}

export function ConfirmDeleteUserDialog({
  open,
  onClose,
  user,
  loading,
  onConfirm,
}: ConfirmDeleteUserDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t("admin.dialogs.delete_user.title", "Remover Usuário")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(
            "admin.dialogs.delete_user.description",
            "Tem certeza de que deseja remover permanentemente o usuário {{name}} (@{{username}})? Esta ação não pode ser desfeita e todas as informações associadas serão excluídas.",
            {
              name: user?.name,
              username: user?.username,
            },
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel", "Cancelar")}</Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          data-testid="confirm-delete-user-btn"
        >
          {loading ? <CircularProgress size={24} /> : t("common.delete", "Excluir")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
