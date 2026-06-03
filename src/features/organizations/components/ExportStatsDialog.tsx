import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useTranslation } from "react-i18next";
import type { OrganizationPlayerStats } from "../../../shared/api/endpoints";

interface ExportStatsDialogProps {
  open: boolean;
  onClose: () => void;
  stats: OrganizationPlayerStats[];
  year: number;
}

export default function ExportStatsDialog({
  open,
  onClose,
  stats,
  year,
}: ExportStatsDialogProps) {
  const { t } = useTranslation();
  const [fields, setFields] = useState({
    player_name: true,
    peladas_played: true,
    goal: true,
    assist: true,
    own_goal: false,
  });
  const [copied, setCopied] = useState(false);

  const handleToggleField = (field: keyof typeof fields) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleCopy = () => {
    // Map state keys to actual translation keys
    const translationKeyMap: Record<string, string> = {
      player_name: "player_name",
      peladas_played: "peladas_played",
      goal: "goals",
      assist: "assists",
      own_goal: "own_goals",
    };

    const enabledFields = Object.entries(fields)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key as keyof typeof fields);

    // Calculate maximum width for each column dynamically
    const colWidths = enabledFields.map((key) => {
      const headerText = t(
        `organizations.stats.export.field.${translationKeyMap[key] || key}`,
      );
      const valLengths = stats.map((stat) => {
        const val = stat[key as keyof OrganizationPlayerStats];
        return val !== undefined && val !== null ? String(val).length : 0;
      });
      return Math.max(headerText.length, ...valLengths);
    });

    const header = enabledFields
      .map((key, index) => {
        const headerText = t(
          `organizations.stats.export.field.${translationKeyMap[key] || key}`,
        );
        const colWidth = colWidths[index];
        if (key === "player_name") {
          return headerText.padEnd(colWidth);
        } else {
          return headerText.padStart(colWidth);
        }
      })
      .join("  ");

    const rows = stats.map((stat) => {
      return enabledFields
        .map((key, index) => {
          const val = stat[key as keyof OrganizationPlayerStats];
          const valStr = val !== undefined && val !== null ? String(val) : "-";
          const colWidth = colWidths[index];
          if (key === "player_name") {
            return valStr.padEnd(colWidth);
          } else {
            return valStr.padStart(colWidth);
          }
        })
        .join("  ");
    });

    const text = `*${t("organizations.stats.export.title", { year })}*\n\`\`\`\n${header}\n${rows.join("\n")}\n\`\`\``;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 2000);
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("organizations.stats.export.dialog_title")}</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: 2,
          }}
        >
          {t("organizations.stats.export.description")}
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={fields.player_name}
                onChange={() => handleToggleField("player_name")}
              />
            }
            label={t("common.player")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={fields.peladas_played}
                onChange={() => handleToggleField("peladas_played")}
              />
            }
            label={t("organizations.stats.table.peladas")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={fields.goal}
                onChange={() => handleToggleField("goal")}
              />
            }
            label={t("common.goals")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={fields.assist}
                onChange={() => handleToggleField("assist")}
              />
            }
            label={t("common.assists")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={fields.own_goal}
                onChange={() => handleToggleField("own_goal")}
              />
            }
            label={t("common.own_goals")}
          />
        </FormGroup>

        {copied && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {t("common.copied")}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          onClick={handleCopy}
          variant="contained"
          startIcon={<ContentCopyIcon />}
        >
          {t("common.copy")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
