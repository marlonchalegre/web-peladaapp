import { useState, useEffect } from "react";
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

export interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  loading: boolean;
  onConfirm: (email: string, phone: string) => void;
}

export function EditUserDialog({
  open,
  onClose,
  user,
  loading,
  onConfirm,
}: EditUserDialogProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setPhone(user.phone || "");
    } else {
      setEmail("");
      setPhone("");
    }
  }, [user, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(email, phone);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit} data-testid="edit-user-form">
        <DialogTitle>
          {t("admin.dialogs.edit_user.title", "Editar Usuário")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {t(
              "admin.dialogs.edit_user.description",
              "Atualize os dados de e-mail e telefone para o usuário {{name}} (@{{username}}).",
              {
                name: user?.name,
                username: user?.username,
              },
            )}
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label={t("admin.dialogs.edit_user.email", "E-mail")}
            type="email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            slotProps={{
              htmlInput: { "data-testid": "edit-user-email-input" },
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("admin.dialogs.edit_user.phone", "Telefone")}
            type="text"
            variant="outlined"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            slotProps={{
              htmlInput: { "data-testid": "edit-user-phone-input" },
            }}
            placeholder="Ex: 5511999999999"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading}
            data-testid="confirm-edit-user-btn"
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              t("common.save", "Salvar")
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
