import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { type User } from "../../../shared/api/endpoints";

export interface ResetPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  value: string;
  onChange: (value: string) => void;
  error: string;
  loading: boolean;
  onConfirm: () => void;
}

export function ResetPasswordDialog({
  open,
  onClose,
  user,
  value,
  onChange,
  error,
  loading,
  onConfirm,
}: ResetPasswordDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t("admin.dialogs.reset_password.title", "Redefinir Senha")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {t(
            "admin.dialogs.reset_password.description",
            "Digite a nova senha para o usuário {{name}} (@{{username}}).",
            {
              name: user?.name,
              username: user?.username,
            },
          )}
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          type="password"
          label={t("admin.dialogs.reset_password.new_password", "Nova Senha")}
          variant="outlined"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={Boolean(error)}
          helperText={error}
          slotProps={{
            htmlInput: { "data-testid": "new-password-input" },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel", "Cancelar")}</Button>
        <Button
          onClick={onConfirm}
          color="primary"
          variant="contained"
          disabled={loading}
          data-testid="confirm-reset-password-btn"
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            t("common.confirm", "Confirmar")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
