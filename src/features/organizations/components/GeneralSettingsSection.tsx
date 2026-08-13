import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Grid,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { useTranslation } from "react-i18next";
import type { Organization } from "../../../shared/api/endpoints";
import { createApi } from "../../../shared/api/endpoints";
import { api } from "../../../shared/api/client";

interface GeneralSettingsSectionProps {
  organization: Organization;
  onUpdateSuccess?: () => void;
}

const endpoints = createApi(api);

export default function GeneralSettingsSection({
  organization,
  onUpdateSuccess,
}: GeneralSettingsSectionProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [priorityLimitHours, setPriorityLimitHours] = useState<string>(
    organization.priority_confirmation_limit_hours != null
      ? String(organization.priority_confirmation_limit_hours)
      : "",
  );

  useEffect(() => {
    setPriorityLimitHours(
      organization.priority_confirmation_limit_hours != null
        ? String(organization.priority_confirmation_limit_hours)
        : "",
    );
  }, [organization.priority_confirmation_limit_hours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setError(null);

    const parsedValue =
      priorityLimitHours.trim() === ""
        ? null
        : Math.max(0, parseInt(priorityLimitHours, 10));

    const currentValue = organization.priority_confirmation_limit_hours ?? null;

    // Avoid redundant network requests if setting hasn't changed
    if (parsedValue === currentValue) {
      setSuccess(true);
      return;
    }

    setLoading(true);
    try {
      await endpoints.updateOrganization(organization.id, {
        name: organization.name,
        priority_confirmation_limit_hours: parsedValue,
      });

      setSuccess(true);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(
              "organizations.management.settings.save_error",
              "Erro ao salvar configurações",
            ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      data-testid="general-settings-section"
      sx={{
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(25, 25, 25, 0.45)"
            : "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(20px)",
        borderRadius: "16px",
        p: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <HourglassTopIcon color="primary" />
        {t(
          "organizations.management.settings.attendance_title",
          "Configurações de Presença",
        )}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t(
          "organizations.management.settings.attendance_subtitle",
          "Defina o prazo limite em horas antes da pelada para a confirmação prioritária dos mensalistas. Após este prazo, confirmações irão para a lista de espera.",
        )}
      </Typography>

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          data-testid="settings-save-success"
        >
          {t(
            "organizations.management.settings.save_success",
            "Configurações salvas com sucesso!",
          )}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          data-testid="settings-save-error"
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="number"
            label={t(
              "organizations.management.settings.priority_limit_hours",
              "Prazo Limite de Confirmação Prioritária (horas)",
            )}
            value={priorityLimitHours}
            onChange={(e) => setPriorityLimitHours(e.target.value)}
            placeholder="ex: 24"
            slotProps={{
              htmlInput: {
                min: 0,
                "data-testid": "priority-confirmation-limit-input",
              },
            }}
            helperText={t(
              "organizations.management.settings.priority_limit_hours_help",
              "Horas antes da partida. Deixe em branco ou 0 para prioridade sem limite.",
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={<SaveIcon />}
          sx={{ borderRadius: "10px", textTransform: "none" }}
          data-testid="save-general-settings-btn"
        >
          {loading
            ? t("common.actions.saving", "Salvando...")
            : t("common.actions.save", "Salvar")}
        </Button>
      </Box>
    </Paper>
  );
}
