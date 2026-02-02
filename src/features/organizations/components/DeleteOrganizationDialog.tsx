import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface DeleteOrganizationDialogProps {
  open: boolean;
  orgName: string;
  confirmName: string;
  onConfirmNameChange: (name: string) => void;
  onClose: () => void;
  onDelete: () => void;
  actionLoading: boolean;
}

export default function DeleteOrganizationDialog({
  open,
  orgName,
  confirmName,
  onConfirmNameChange,
  onClose,
  onDelete,
  actionLoading,
}: DeleteOrganizationDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: "error.main", fontWeight: "bold" }}>
        {t("organizations.management.delete_confirm_title")}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t("organizations.management.delete_confirm_instruction", {
            name: orgName,
          })}
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={confirmName}
          onChange={(e) => onConfirmNameChange(e.target.value)}
          placeholder={orgName}
          autoComplete="off"
          onPaste={(e) => e.preventDefault()}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={actionLoading}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={confirmName !== orgName || actionLoading}
          onClick={onDelete}
        >
          {actionLoading ? <CircularProgress size={24} /> : t("common.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
