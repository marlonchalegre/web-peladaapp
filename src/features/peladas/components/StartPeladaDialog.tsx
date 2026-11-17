import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type {
  PeladaFormat,
  PeladaFormatConfig,
} from "../../../shared/api/endpoints";
import PeladaFormatSelector from "./PeladaFormatSelector";

interface StartPeladaDialogProps {
  open: boolean;
  matchesPerTeam: string;
  onMatchesChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  teamCount?: number;
  format?: PeladaFormat;
  formatConfig?: PeladaFormatConfig;
  onFormatChange?: (format: PeladaFormat) => void;
  onFormatConfigChange?: (config: PeladaFormatConfig) => void;
}

export default function StartPeladaDialog({
  open,
  matchesPerTeam,
  onMatchesChange,
  onClose,
  onConfirm,
  teamCount = 2,
  format = "round_robin",
  formatConfig = {},
  onFormatChange,
  onFormatConfigChange,
}: StartPeladaDialogProps) {
  const { t } = useTranslation();
  const parsedMatches = parseInt(matchesPerTeam, 10);
  const isValidMatches =
    format === "winner_stays_on" ||
    (Boolean(matchesPerTeam) && !isNaN(parsedMatches) && parsedMatches > 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("peladas.dialog.start.title")}</DialogTitle>
      <DialogContent dividers>
        {onFormatChange && onFormatConfigChange ? (
          <Box sx={{ mb: format !== "winner_stays_on" ? 2 : 0 }}>
            <PeladaFormatSelector
              teamCount={teamCount}
              format={format}
              formatConfig={formatConfig}
              matchesPerTeam={isNaN(parsedMatches) ? 2 : parsedMatches}
              onFormatChange={onFormatChange}
              onFormatConfigChange={onFormatConfigChange}
              onMatchesPerTeamChange={(val) => onMatchesChange(String(val))}
              showMatchesPerTeamSelect={false}
            />
          </Box>
        ) : null}

        {format !== "winner_stays_on" && (
          <TextField
            autoFocus={!onFormatChange}
            margin="dense"
            label={t("peladas.dialog.start.matches_per_team")}
            type="number"
            fullWidth
            variant="outlined"
            value={matchesPerTeam}
            onChange={(e) => onMatchesChange(e.target.value)}
            slotProps={{
              htmlInput: { min: 1 },
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          variant="contained"
          disabled={!isValidMatches}
          onClick={onConfirm}
          data-testid="confirm-start-pelada-button"
        >
          {t("common.start")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
