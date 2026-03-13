import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface PrettyConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  severity?: "primary" | "error" | "warning";
}

export default function PrettyConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  severity = "primary",
}: PrettyConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: "bold" }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="text"
          sx={{ color: "text.secondary" }}
        >
          {cancelLabel || t("common.cancel")}
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          variant="contained"
          color={severity === "primary" ? "primary" : severity}
          sx={{ borderRadius: 2, fontWeight: "bold", px: 3 }}
          autoFocus
        >
          {confirmLabel || t("common.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
