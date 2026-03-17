import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Paper,
  Alert,
  Grid,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Organization } from "../../../shared/api/endpoints";
import { createApi } from "../../../shared/api/endpoints";
import { api } from "../../../shared/api/client";

interface WahaConfigSectionProps {
  organization: Organization;
  onUpdateSuccess?: () => void;
}

const endpoints = createApi(api);

export default function WahaConfigSection({
  organization,
  onUpdateSuccess,
}: WahaConfigSectionProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    waha_api_url: organization.waha_api_url || "",
    waha_instance: organization.waha_instance || "",
    waha_group_id: organization.waha_group_id || "",
    waha_enabled: organization.waha_enabled || false,
    waha_start_msg_enabled: organization.waha_start_msg_enabled || false,
    waha_end_msg_enabled: organization.waha_end_msg_enabled || false,
    waha_attendance_reminder_enabled:
      organization.waha_attendance_reminder_enabled || false,
    waha_vote_reminder_enabled:
      organization.waha_vote_reminder_enabled || false,
    waha_vote_ended_msg_enabled:
      organization.waha_vote_ended_msg_enabled || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setTestSuccess(false);

    try {
      await endpoints.updateOrganization(organization.id, formData);
      setSuccess(true);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("organizations.management.waha.error.save_failed"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setError(null);
    setTestSuccess(false);
    setSuccess(false);

    try {
      await endpoints.testWaha(organization.id);
      setTestSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("organizations.management.waha.error.test_failed"),
      );
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("organizations.management.waha.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t("organizations.management.waha.subtitle")}
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {t("organizations.management.waha.save_success")}
          </Alert>
        )}

        {testSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {t("organizations.management.waha.test_success")}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label={t("organizations.management.waha.api_url")}
              name="waha_api_url"
              value={formData.waha_api_url}
              onChange={handleChange}
              placeholder="http://localhost:3000"
              helperText="URL base do WAHA"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label={t("organizations.management.waha.instance")}
              name="waha_instance"
              value={formData.waha_instance}
              onChange={handleChange}
              placeholder="default"
              helperText="Nome da sessão configurada no WAHA"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label={t("organizations.management.waha.group_id")}
              name="waha_group_id"
              value={formData.waha_group_id}
              onChange={handleChange}
              placeholder="1234567890@g.us"
              helperText="ID do grupo ou contato do WhatsApp"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.waha_enabled}
                  onChange={handleChange}
                  name="waha_enabled"
                  color="primary"
                />
              }
              label={t("organizations.management.waha.enabled")}
            />
          </Grid>

          {formData.waha_enabled && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.waha_start_msg_enabled}
                      onChange={handleChange}
                      name="waha_start_msg_enabled"
                    />
                  }
                  label={t("organizations.management.waha.start_msg_enabled")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.waha_end_msg_enabled}
                      onChange={handleChange}
                      name="waha_end_msg_enabled"
                    />
                  }
                  label={t("organizations.management.waha.end_msg_enabled")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.waha_attendance_reminder_enabled}
                      onChange={handleChange}
                      name="waha_attendance_reminder_enabled"
                    />
                  }
                  label={t(
                    "organizations.management.waha.attendance_reminder_enabled",
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.waha_vote_reminder_enabled}
                      onChange={handleChange}
                      name="waha_vote_reminder_enabled"
                    />
                  }
                  label={t(
                    "organizations.management.waha.vote_reminder_enabled",
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.waha_vote_ended_msg_enabled}
                      onChange={handleChange}
                      name="waha_vote_ended_msg_enabled"
                    />
                  }
                  label={t(
                    "organizations.management.waha.vote_ended_msg_enabled",
                  )}
                />
              </Grid>
            </>
          )}

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading
                  ? t("common.actions.saving")
                  : t("common.actions.save")}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleTestConnection}
                disabled={testLoading || !organization.waha_enabled}
              >
                {testLoading
                  ? t("common.sending")
                  : t("organizations.management.waha.test_connection")}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
