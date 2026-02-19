import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface StartPeladaDialogProps {
  open: boolean;
  matchesPerTeam: string;
  onMatchesChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function StartPeladaDialog({
  open,
  matchesPerTeam,
  onMatchesChange,
  onClose,
  onConfirm,
}: StartPeladaDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("peladas.dialog.start.title")}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={t("peladas.dialog.start.matches_per_team")}
          type="number"
          fullWidth
          variant="outlined"
          value={matchesPerTeam}
          onChange={(e) => onMatchesChange(e.target.value)}
          inputProps={{ min: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          variant="contained"
          disabled={!matchesPerTeam || parseInt(matchesPerTeam) <= 0}
          onClick={onConfirm}
          data-testid="confirm-start-pelada-button"
        >
          {t("common.start")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
