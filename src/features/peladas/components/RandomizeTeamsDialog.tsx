import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Switch,
  Box,
  Chip,
} from "@mui/material";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RuleIcon from "@mui/icons-material/Rule";
import HistoryIcon from "@mui/icons-material/History";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import {
  DRAW_ALGORITHMS,
  type DrawAlgorithm,
} from "../../../shared/api/endpoints";

interface RandomizeTeamsDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (options: {
    algorithm: DrawAlgorithm;
    useHistory: boolean;
  }) => void;
  loading?: boolean;
}

const ALGORITHM_ICONS: Record<DrawAlgorithm, SvgIconComponent> = {
  classic: ShuffleIcon,
  gemini: AutoAwesomeIcon,
  gpt: RuleIcon,
};

export default function RandomizeTeamsDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
}: RandomizeTeamsDialogProps) {
  const { t } = useTranslation();
  // Defaults to the algorithm the group already knows; the new ones are opt-in.
  const [algorithm, setAlgorithm] = useState<DrawAlgorithm>("classic");
  const [useHistory, setUseHistory] = useState(true);

  // The classic count has no historical signals to switch on.
  const supportsHistory = algorithm !== "classic";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>
        {t("peladas.detail.randomize_dialog.title")}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {t("peladas.detail.randomize_dialog.description")}
        </Typography>

        <RadioGroup
          value={algorithm}
          onChange={(event) =>
            setAlgorithm(event.target.value as DrawAlgorithm)
          }
        >
          <Stack spacing={1.5}>
            {DRAW_ALGORITHMS.map((option) => {
              const selected = algorithm === option;
              const Icon = ALGORITHM_ICONS[option];
              return (
                <Paper
                  key={option}
                  component="label"
                  elevation={0}
                  data-testid={`draw-algorithm-${option}`}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    border: "2px solid",
                    borderColor: selected ? "primary.main" : "divider",
                    bgcolor: selected ? "primary.lighter" : "background.paper",
                    transition: "border-color 120ms, background-color 120ms",
                    "&:hover": { borderColor: "primary.main" },
                  }}
                >
                  <Radio value={option} size="small" sx={{ p: 0, mt: 0.25 }} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", mb: 0.5 }}
                    >
                      <Icon
                        sx={{
                          color: selected ? "primary.main" : "text.secondary",
                        }}
                      />
                      <Typography sx={{ fontWeight: 900 }}>
                        {t(`peladas.detail.draw.algorithm.${option}.name`)}
                      </Typography>
                      <Chip
                        size="small"
                        label={t(`peladas.detail.draw.algorithm.${option}.tag`)}
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.65rem",
                          height: 20,
                        }}
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {t(`peladas.detail.draw.algorithm.${option}.description`)}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </RadioGroup>

        <Stack sx={{ mt: 2.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={supportsHistory && useHistory}
                onChange={(event) => setUseHistory(event.target.checked)}
                disabled={!supportsHistory || loading}
                data-testid="draw-use-history-toggle"
                slotProps={{
                  input: {
                    "aria-label": t(
                      "peladas.detail.randomize_dialog.use_history",
                    ),
                  },
                }}
              />
            }
            label={
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <HistoryIcon fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {t("peladas.detail.randomize_dialog.use_history")}
                </Typography>
              </Stack>
            }
          />
          <Typography
            variant="caption"
            sx={{ display: "block", color: "text.secondary", pl: 6 }}
          >
            {supportsHistory
              ? t("peladas.detail.randomize_dialog.use_history_hint")
              : t("peladas.detail.randomize_dialog.use_history_unavailable")}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="text"
          sx={{ color: "text.secondary" }}
          disabled={loading}
        >
          {t("peladas.detail.randomize_dialog.cancel")}
        </Button>
        <Button
          onClick={() => {
            onConfirm({
              algorithm,
              useHistory: supportsHistory && useHistory,
            });
            onClose();
          }}
          variant="contained"
          disabled={loading}
          data-testid="confirm-randomize-button"
          sx={{ borderRadius: 2, fontWeight: 900, px: 3 }}
        >
          {t("peladas.detail.randomize_dialog.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
